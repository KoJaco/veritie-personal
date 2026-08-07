"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, Square } from "lucide-react";
import type { useVeritie, PipelineHandle, LiveJobSession } from "@veritie/sdk";
import type { JobDetailResponse } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";
import { Button } from "@/components/ui/button";
import { LiveAudioWaveform } from "@/components/capture/LiveAudioWaveform";
import { IndexedResultSurface } from "@/components/capture/indexed-result";
import type { CaptureLeasePhase } from "@/components/capture/VeritieCaptureLeaseContext";
import {
    captureFlowLog,
    flushPendingChunkUploads,
    type CaptureFlowDiagnostics,
} from "@/lib/capture/capture-flow-logger";
import { enqueueCaptureBackgroundPipeline } from "@/lib/capture/capture-background-pipeline";
import { captureJobCoordinator } from "@/lib/capture/capture-job-coordinator";
import {
    fetchCaptureAudioPlaybackUrl,
    uploadCaptureAudio,
    uploadCaptureJobAudio,
} from "@/lib/capture/capture-audio-client";
import {
    createLiveChunkStreamState,
    endLiveAudioStream,
    flushBufferedLiveChunks,
    MAX_LIVE_STREAM_BYTES,
    sendLiveAudioChunk,
    type LiveChunkStreamState,
} from "@/lib/capture/live-audio-stream";
import { mapJobToIndexedProps } from "@/lib/capture/map-job-to-indexed-props";
import { buildCaptureJobMetadata } from "@/lib/capture/build-capture-job-metadata";
import { persistCaptureForVoiceFlow } from "@/lib/capture/persist-capture-client";
import type { CaptureJobMetadata } from "@veritie/sdk";
import { isTranscriptPending } from "@/lib/capture/transcript-readiness";
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import { SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

type VeritieHook = ReturnType<typeof useVeritie>;

const MAX_RECORDING_MS = 5 * 60 * 1000;

type VoicePhase =
    | "ready"
    | "requesting_microphone"
    | "recording"
    | "processing"
    | "transcript_ready"
    | "failed";

type PersistCaptureResult = {
    captureId: string;
    timelineEventCount: number;
};

export function VoiceCapturePanel({
    veritie,
    captureHandle,
    leasePhase,
    leaseError = null,
    prepareLease,
    renewLease,
    embedded = true,
    onBack,
    onComplete,
    saveVoiceLogAudio = false,
    captureLocationLabel = "",
    glossaryLabels,
    persistCaptureFn = persistCaptureForVoiceFlow,
}: {
    veritie: VeritieHook;
    captureHandle: PipelineHandle | null;
    leasePhase: CaptureLeasePhase;
    leaseError?: string | null;
    prepareLease: (metadata: CaptureJobMetadata) => Promise<PipelineHandle>;
    renewLease: () => void;
    embedded?: boolean;
    onBack: () => void;
    onComplete: () => void;
    saveVoiceLogAudio?: boolean;
    captureLocationLabel?: string;
    glossaryLabels?: Record<string, string>;
    persistCaptureFn?: (jobId: string) => Promise<PersistCaptureResult>;
}) {
    const [phase, setPhase] = useState<VoicePhase>("ready");
    const [error, setError] = useState<string | null>(null);
    const [statusLine, setStatusLine] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [indexedJob, setIndexedJob] = useState<JobDetailResponse | null>(null);
    const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
    const [isRecorderLive, setIsRecorderLive] = useState(false);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const openAbortRef = useRef<AbortController | null>(null);
    const finalizeAbortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingStartedAtRef = useRef<number | null>(null);
    const finishCaptureRef = useRef<(() => Promise<void>) | null>(null);
    const liveSessionRef = useRef<LiveJobSession | null>(null);
    const chunkStreamStateRef = useRef<LiveChunkStreamState>(
        createLiveChunkStreamState(),
    );
    const chunkSendChainRef = useRef<Promise<void>>(Promise.resolve());
    const diagnosticsRef = useRef<CaptureFlowDiagnostics>({
        dataAvailableEvents: 0,
        dataAvailableEmpty: 0,
        dataAvailableBytes: 0,
        chunksSent: 0,
        chunksBytesSent: 0,
    });
    const audioChunksRef = useRef<Blob[]>([]);
    const pendingChunksRef = useRef<Blob[]>([]);
    const pendingChunkBytesRef = useRef(0);
    const micPrewarmRef = useRef<MediaStream | null>(null);
    const captureInProgressRef = useRef(false);
    const saveVoiceLogAudioRef = useRef(saveVoiceLogAudio);
    saveVoiceLogAudioRef.current = saveVoiceLogAudio;
    const captureLocationLabelRef = useRef(captureLocationLabel);
    captureLocationLabelRef.current = captureLocationLabel;
    const activeCaptureHandleRef = useRef<PipelineHandle | null>(null);

    const logDiagnostics = useCallback((step: string, extra?: Record<string, unknown>) => {
        captureFlowLog.snapshot(step, {
            ...diagnosticsRef.current,
            ...extra,
        });
    }, []);

    const resetDiagnostics = useCallback((partial?: Partial<CaptureFlowDiagnostics>) => {
        diagnosticsRef.current = {
            dataAvailableEvents: 0,
            dataAvailableEmpty: 0,
            dataAvailableBytes: 0,
            chunksSent: 0,
            chunksBytesSent: 0,
            ...partial,
        };
    }, []);

    const shouldKeepScreenAwake =
        phase === "requesting_microphone" ||
        phase === "recording" ||
        phase === "processing";
    useScreenWakeLock(shouldKeepScreenAwake);

    const stopMicPrewarm = useCallback(() => {
        if (recorderRef.current || captureInProgressRef.current) {
            return;
        }

        const prewarmed = micPrewarmRef.current;
        if (prewarmed) {
            prewarmed.getTracks().forEach((track) => track.stop());
            micPrewarmRef.current = null;
        }

        if (streamRef.current === prewarmed) {
            streamRef.current = null;
            setStream(null);
        }
    }, []);

    const stopLocalRecording = useCallback(() => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        recordingStartedAtRef.current = null;
        setRecordingElapsedMs(0);
        setIsRecorderLive(false);

        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
        recorderRef.current = null;

        const activeStream = streamRef.current;
        if (activeStream) {
            activeStream.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = null;
        setStream(null);
        captureInProgressRef.current = false;
    }, []);

    const closeLiveSession = useCallback(() => {
        const session = liveSessionRef.current;
        if (session && !session.closed) {
            session.close(1000, "capture cancelled");
        }
        liveSessionRef.current = null;
        chunkStreamStateRef.current = createLiveChunkStreamState();
        chunkSendChainRef.current = Promise.resolve();
        pendingChunksRef.current = [];
        pendingChunkBytesRef.current = 0;
    }, []);

    const abortOpenWork = useCallback(() => {
        openAbortRef.current?.abort();
        openAbortRef.current = null;
    }, []);

    const abortFinalizeWork = useCallback(() => {
        finalizeAbortRef.current?.abort();
        finalizeAbortRef.current = null;
    }, []);

    const abortInFlightWork = useCallback(() => {
        abortOpenWork();
        abortFinalizeWork();
        closeLiveSession();
    }, [abortOpenWork, abortFinalizeWork, closeLiveSession]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortInFlightWork();
            stopLocalRecording();
        };
    }, [abortInFlightWork, stopLocalRecording]);

    useEffect(() => {
        if (!activeJobId) {
            return;
        }

        return captureJobCoordinator.subscribe((event) => {
            if (event.jobId !== activeJobId) {
                return;
            }

            if (event.type === "capture:job-update") {
                setIndexedJob(event.job);
            }

            if (
                (event.type === "capture:enriched" ||
                    event.type === "capture:audio-uploaded") &&
                saveVoiceLogAudioRef.current
            ) {
                void fetchCaptureAudioPlaybackUrl(event.captureId).then(
                    (url) => {
                        if (mountedRef.current && url) {
                            setAudioPlaybackUrl(url);
                        }
                    },
                );
            }
        });
    }, [activeJobId]);

    useEffect(() => {
        if (leasePhase !== "preparing" && leasePhase !== "ready") {
            return;
        }
        if (phase !== "ready") {
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            return;
        }

        let cancelled = false;

        void navigator.mediaDevices.getUserMedia({ audio: true }).then((mediaStream) => {
            if (cancelled || !mountedRef.current) {
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
            }

            micPrewarmRef.current = mediaStream;
            streamRef.current = mediaStream;
            setStream(mediaStream);
        });

        return () => {
            cancelled = true;
            if (!captureInProgressRef.current) {
                stopMicPrewarm();
            }
        };
    }, [leasePhase, phase, stopMicPrewarm]);

    const startCapture = useCallback(async () => {
        if (leasePhase === "preparing" || !captureHandle) {
            return;
        }

        abortInFlightWork();
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setIndexedJob(null);
        setAudioPlaybackUrl(null);
        setActiveJobId(null);
        audioChunksRef.current = [];
        pendingChunksRef.current = [];
        pendingChunkBytesRef.current = 0;

        const openController = new AbortController();
        openAbortRef.current = openController;
        const { signal: openSignal } = openController;

        const handle = captureHandle;
        activeCaptureHandleRef.current = handle;
        const jobId = handle.snapshot.jobId;
        const prewarmedStream = micPrewarmRef.current;
        micPrewarmRef.current = null;
        captureInProgressRef.current = true;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Microphone not available in this browser.");
            }

            resetDiagnostics({
                jobId,
                leasePhase,
            });
            captureFlowLog.info("capture.start", {
                jobId,
                leasePhase,
            });

            recordingStartedAtRef.current = Date.now();
            setPhase("recording");
            recordingTimerRef.current = setInterval(() => {
                const startedAt = recordingStartedAtRef.current;
                if (!startedAt) return;
                const elapsed = Date.now() - startedAt;
                setRecordingElapsedMs(elapsed);
                if (elapsed >= MAX_RECORDING_MS) {
                    void finishCaptureRef.current?.();
                }
            }, 500);

            const handleChunkSendError = (chunkError: unknown) => {
                captureFlowLog.error("chunk.send_failed", {
                    jobId,
                    error:
                        chunkError instanceof Error
                            ? chunkError.message
                            : String(chunkError),
                });
                if (!mountedRef.current) return;
                setError(
                    chunkError instanceof Error
                        ? chunkError.message
                        : "Failed to stream audio chunk.",
                );
                setPhase("failed");
                stopLocalRecording();
                closeLiveSession();
                renewLease();
            };

            const enqueuePendingChunk = (data: Blob) => {
                if (data.size === 0) {
                    return;
                }
                if (
                    pendingChunkBytesRef.current + data.size >
                    MAX_LIVE_STREAM_BYTES
                ) {
                    throw new Error(
                        "Recording exceeded the maximum live stream size.",
                    );
                }
                pendingChunksRef.current.push(data);
                pendingChunkBytesRef.current += data.size;
            };

            const scheduleChunkSend = (data: Blob) => {
                if (data.size === 0) {
                    return;
                }

                diagnosticsRef.current.dataAvailableBytes =
                    (diagnosticsRef.current.dataAvailableBytes ?? 0) + data.size;

                if (saveVoiceLogAudioRef.current) {
                    audioChunksRef.current.push(data);
                }

                captureFlowLog.debug("recorder.dataavailable", {
                    jobId,
                    bytes: data.size,
                    buffered: !liveSessionRef.current,
                });

                if (!liveSessionRef.current) {
                    enqueuePendingChunk(data);
                    return;
                }

                chunkSendChainRef.current = chunkSendChainRef.current
                    .then(async () => {
                        if (!liveSessionRef.current) {
                            enqueuePendingChunk(data);
                            return;
                        }
                        const before = chunkStreamStateRef.current;
                        chunkStreamStateRef.current = await sendLiveAudioChunk(
                            liveSessionRef.current,
                            chunkStreamStateRef.current,
                            data,
                        );
                        if (chunkStreamStateRef.current.sequence > before.sequence) {
                            diagnosticsRef.current.chunksSent =
                                chunkStreamStateRef.current.sequence;
                            diagnosticsRef.current.chunksBytesSent =
                                chunkStreamStateRef.current.offsetBytes;
                        }
                    })
                    .catch(handleChunkSendError);
            };

            const attachLiveSession = (liveSession: LiveJobSession) => {
                liveSessionRef.current = liveSession;
                diagnosticsRef.current.sessionId = liveSession.sessionId;
                chunkStreamStateRef.current = createLiveChunkStreamState();
                chunkSendChainRef.current = Promise.resolve();

                captureFlowLog.info("live.session.opened", {
                    jobId,
                    sessionId: liveSession.sessionId,
                });

                const pending = pendingChunksRef.current;
                pendingChunksRef.current = [];
                pendingChunkBytesRef.current = 0;

                if (pending.length === 0) {
                    return;
                }

                chunkSendChainRef.current = chunkSendChainRef.current
                    .then(async () => {
                        const before = chunkStreamStateRef.current;
                        chunkStreamStateRef.current = await flushBufferedLiveChunks(
                            liveSession,
                            chunkStreamStateRef.current,
                            pending,
                        );
                        if (chunkStreamStateRef.current.sequence > before.sequence) {
                            diagnosticsRef.current.chunksSent =
                                chunkStreamStateRef.current.sequence;
                            diagnosticsRef.current.chunksBytesSent =
                                chunkStreamStateRef.current.offsetBytes;
                        }
                    })
                    .catch(handleChunkSendError);
            };

            const sessionPromise = handle.startCapture({
                signal: openSignal,
            });

            const micPromise = prewarmedStream
                ? Promise.resolve(prewarmedStream)
                : navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaStream = await micPromise;

            if (!mountedRef.current || openSignal.aborted) {
                mediaStream.getTracks().forEach((track) => track.stop());
                captureInProgressRef.current = false;
                return;
            }

            streamRef.current = mediaStream;
            setStream(mediaStream);

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "";
            const recorder = mimeType
                ? new MediaRecorder(mediaStream, { mimeType })
                : new MediaRecorder(mediaStream);
            diagnosticsRef.current.recorderMimeType = recorder.mimeType;

            const liveTracks = mediaStream
                .getAudioTracks()
                .filter((track) => track.readyState === "live");
            if (liveTracks.length === 0) {
                throw new Error(
                    "Microphone is not available. Check permissions and try again.",
                );
            }

            recorder.ondataavailable = (event) => {
                diagnosticsRef.current.dataAvailableEvents =
                    (diagnosticsRef.current.dataAvailableEvents ?? 0) + 1;

                if (event.data.size === 0) {
                    diagnosticsRef.current.dataAvailableEmpty =
                        (diagnosticsRef.current.dataAvailableEmpty ?? 0) + 1;
                    captureFlowLog.debug("recorder.dataavailable.empty", {
                        jobId,
                        recorderState: recorder.state,
                    });
                    return;
                }

                try {
                    scheduleChunkSend(event.data);
                } catch (chunkError) {
                    handleChunkSendError(chunkError);
                }
            };
            recorder.onerror = () => {
                if (!mountedRef.current) return;
                setError("Recording failed.");
                setPhase("failed");
                stopLocalRecording();
                closeLiveSession();
                renewLease();
            };

            recorder.start(250);
            recorderRef.current = recorder;
            setIsRecorderLive(true);
            captureFlowLog.info("recorder.started", {
                jobId,
                mimeType: recorder.mimeType,
                timesliceMs: 250,
            });

            sessionPromise
                .then((liveSession) => {
                    if (!mountedRef.current || openSignal.aborted) {
                        liveSession.close(1000, "aborted");
                        return;
                    }

                    openAbortRef.current = null;
                    attachLiveSession(liveSession);
                })
                .catch((sessionError) => {
                    if (!mountedRef.current || openSignal.aborted) {
                        return;
                    }
                    captureInProgressRef.current = false;
                    stopLocalRecording();
                    closeLiveSession();
                    captureFlowLog.error("capture.start_failed", {
                        jobId,
                        error:
                            sessionError instanceof Error
                                ? sessionError.message
                                : String(sessionError),
                    });
                    setError(
                        sessionError instanceof Error
                            ? sessionError.message
                            : "Failed to open live session.",
                    );
                    setPhase("failed");
                    renewLease();
                });
        } catch (captureError) {
            if (!mountedRef.current || openController.signal.aborted) return;
            captureInProgressRef.current = false;
            stopLocalRecording();
            closeLiveSession();
            captureFlowLog.error("capture.start_failed", {
                jobId: activeCaptureHandleRef.current?.snapshot.jobId,
                error:
                    captureError instanceof Error
                        ? captureError.message
                        : String(captureError),
            });
            setError(
                captureError instanceof Error
                    ? captureError.message
                    : "Could not access microphone.",
            );
            setPhase("failed");
            setStatusLine(null);
            renewLease();
        }
    }, [
        abortInFlightWork,
        captureHandle,
        closeLiveSession,
        leasePhase,
        renewLease,
        stopLocalRecording,
        resetDiagnostics,
    ]);

    const retryLease = useCallback(() => {
        const metadata = buildCaptureJobMetadata({
            capturedAt: new Date().toISOString(),
            locationLabel: captureLocationLabelRef.current,
        });
        void prepareLease(metadata).catch(() => {
            // Errors surface via leaseError.
        });
    }, [prepareLease]);

    const finishCapture = useCallback(async () => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === "inactive") {
            return;
        }

        const finalizeController = new AbortController();
        finalizeAbortRef.current = finalizeController;
        const { signal } = finalizeController;

        setPhase("processing");
        setStatusLine("Finishing recording…");

        const handle = activeCaptureHandleRef.current ?? captureHandle;

        try {
            const recordingStartedAt = recordingStartedAtRef.current;
            diagnosticsRef.current.recorderState = recorder.state;

            await new Promise<void>((resolve, reject) => {
                recorder.addEventListener("stop", () => resolve(), { once: true });
                recorder.addEventListener(
                    "error",
                    () => reject(new Error("Recording failed")),
                    { once: true },
                );
                recorder.stop();
            });

            if (!mountedRef.current || signal.aborted) return;

            diagnosticsRef.current.recordingDurationMs = recordingStartedAt
                ? Date.now() - recordingStartedAt
                : undefined;
            diagnosticsRef.current.recorderState = recorder.state;

            captureFlowLog.info("recorder.stopped", {
                jobId: handle?.snapshot.jobId,
                recordingDurationMs: diagnosticsRef.current.recordingDurationMs,
                dataAvailableEvents: diagnosticsRef.current.dataAvailableEvents,
            });

            stopLocalRecording();

            const session = liveSessionRef.current;
            if (!session || !handle) {
                throw new Error("Live capture session is not available.");
            }

            setStatusLine("Finalizing live stream…");
            await flushPendingChunkUploads(chunkSendChainRef.current);
            diagnosticsRef.current.uploadChainSettled = true;
            diagnosticsRef.current.chunkSequenceAtEnd =
                chunkStreamStateRef.current.sequence;

            logDiagnostics("stream.end.before", {
                sessionId: session.sessionId,
            });

            await endLiveAudioStream(session, chunkStreamStateRef.current);
            liveSessionRef.current = null;

            captureFlowLog.info("stream.ended", {
                jobId: handle.snapshot.jobId,
                sessionId: session.sessionId,
                chunks: chunkStreamStateRef.current.sequence,
                totalBytes: chunkStreamStateRef.current.offsetBytes,
            });

            const jobId = handle.snapshot.jobId;

            const recorderMimeType =
                diagnosticsRef.current.recorderMimeType ?? "audio/webm";
            const audioBlob =
                saveVoiceLogAudioRef.current &&
                    audioChunksRef.current.length > 0
                    ? new Blob(audioChunksRef.current, {
                        type: recorderMimeType,
                    })
                    : null;

            const audioStagedForJob =
                saveVoiceLogAudioRef.current && audioBlob != null;

            let audioStagingPromise: Promise<void> | undefined;
            if (audioStagedForJob && audioBlob) {
                audioStagingPromise = uploadCaptureJobAudio(jobId, audioBlob).catch(
                    (stagingError) => {
                        captureFlowLog.error("audio.staging.failed", {
                            jobId,
                            error:
                                stagingError instanceof Error
                                    ? stagingError.message
                                    : String(stagingError),
                        });
                        throw stagingError;
                    },
                );
            }

            let job = await handle.refresh({ signal });
            setStatusLine("Waiting for transcript…");
            let polls = 0;
            while (isTranscriptPending(job) && polls < 40) {
                if (!mountedRef.current || signal.aborted) return;
                await sleep(1500, signal);
                job = await veritie.getJob(jobId, { signal });
                polls += 1;
            }

            if (!mountedRef.current || signal.aborted) return;

            const transcriptText = job.transcript?.text?.trim();
            if (!transcriptText) {
                throw new Error("Transcript is not available yet.");
            }

            setTranscript(transcriptText);
            setIndexedJob(job);
            setActiveJobId(jobId);
            setPhase("transcript_ready");
            setStatusLine(null);
            finalizeAbortRef.current = null;

            captureFlowLog.info("transcript.ready", {
                jobId,
                transcriptLength: transcriptText.length,
                polls,
            });

            enqueueCaptureBackgroundPipeline({
                jobId,
                veritie,
                persistCaptureFn,
                audioStagedForJob,
                audioStagingPromise,
                audioBlob: audioStagedForJob ? null : audioBlob,
                uploadAudioFn:
                    audioStagedForJob || !saveVoiceLogAudioRef.current
                        ? undefined
                        : uploadCaptureAudio,
                onJobUpdate: (updatedJob) => {
                    if (mountedRef.current) {
                        setIndexedJob(updatedJob);
                    }
                },
            });
        } catch (captureError) {
            if (!mountedRef.current || signal.aborted) return;
            stopLocalRecording();
            closeLiveSession();

            setError(
                captureError instanceof Error
                    ? captureError.message
                    : "Capture failed.",
            );
            logDiagnostics("capture.failed", {
                error:
                    captureError instanceof Error
                        ? captureError.message
                        : String(captureError),
            });
            setPhase("failed");
            setStatusLine(null);
            renewLease();
        }
    }, [
        captureHandle,
        closeLiveSession,
        persistCaptureFn,
        renewLease,
        stopLocalRecording,
        veritie,
        logDiagnostics,
    ]);

    finishCaptureRef.current = finishCapture;

    const cancelCapture = useCallback(() => {
        abortInFlightWork();
        captureInProgressRef.current = false;
        stopLocalRecording();
        stopMicPrewarm();
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setIndexedJob(null);
        setAudioPlaybackUrl(null);
        setActiveJobId(null);
        audioChunksRef.current = [];
        setPhase("ready");
        renewLease();
        const metadata = buildCaptureJobMetadata({
            capturedAt: new Date().toISOString(),
            locationLabel: captureLocationLabelRef.current,
        });
        void prepareLease(metadata).catch(() => {
            // Errors surface via leaseError.
        });
    }, [abortInFlightWork, prepareLease, renewLease, stopLocalRecording, stopMicPrewarm]);

    const handleBack = useCallback(() => {
        abortInFlightWork();
        captureInProgressRef.current = false;
        stopLocalRecording();
        stopMicPrewarm();
        onBack();
    }, [abortInFlightWork, onBack, stopLocalRecording, stopMicPrewarm]);

    const waveformMode =
        phase === "recording"
            ? isRecorderLive
                ? "active"
                : "passive"
            : phase === "processing" || phase === "requesting_microphone"
                ? "passive"
                : "idle";

    const isRecording = phase === "recording";
    const canStart =
        (phase === "ready" || phase === "failed") &&
        leasePhase === "ready" &&
        captureHandle !== null;
    const isPreparingLease = leasePhase === "preparing";

    const recordingMinutes = Math.floor(recordingElapsedMs / 60_000);
    const recordingSeconds = Math.floor((recordingElapsedMs % 60_000) / 1000);

    const indexedProps = indexedJob
        ? mapJobToIndexedProps(indexedJob, audioPlaybackUrl)
        : null;
    const showIndexedSurface =
        phase === "transcript_ready" && indexedProps !== null;
    const indexingPending =
        indexedJob !== null && hasPendingJobEnrichment(indexedJob);

    return (
        <div
            className={cn(
                "flex min-h-[280px] w-full flex-col",
                phase === "processing" && "animate-pulse",
            )}
        >
            <div className="flex shrink-0 items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                >
                    <ArrowLeft className="size-4" />
                    Capture
                </Button>
                {isRecording && (
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        {recordingMinutes}:{recordingSeconds.toString().padStart(2, "0")}
                    </span>
                )}
                {phase === "processing" && (
                    <span className="text-xs font-medium text-muted-foreground animate-pulse">
                        Processing…
                    </span>
                )}
                {phase === "transcript_ready" && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Transcript ready
                    </span>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 py-3">
                {phase !== "transcript_ready" ? (
                    <div className="flex flex-1 items-center justify-center min-h-[120px]">
                        <LiveAudioWaveform stream={stream} mode={waveformMode} />
                    </div>
                ) : null}

                {isPreparingLease && phase === "ready" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Preparing Veritie lease…
                    </div>
                )}

                {(error || leaseError) && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <p className="font-medium">Voice log unavailable</p>
                        <p className="mt-1 text-destructive/90">{error ?? leaseError}</p>
                        {leaseError && !error ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={retryLease}
                            >
                                Retry lease
                            </Button>
                        ) : null}
                    </div>
                )}

                {statusLine && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        {statusLine}
                    </div>
                )}

                {transcript && !showIndexedSurface && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Transcript</p>
                        <p className="text-sm leading-6 text-foreground/80 whitespace-pre-wrap">
                            {transcript}
                        </p>
                    </div>
                )}

                {showIndexedSurface && indexedProps ? (
                    <div
                        className={cn(
                            SURFACE_CLASS_NESTED,
                            "min-h-0 flex-1 overflow-y-auto rounded-xl p-3",
                        )}
                    >
                        <IndexedResultSurface
                            {...indexedProps}
                            layout="embedded"
                            expectAudio={saveVoiceLogAudio}
                            showIndexingBanner
                            indexingState={indexedJob?.indexing_state ?? null}
                            glossaryLabels={glossaryLabels}
                        />
                        {indexingPending ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Indexing extraction in the background…
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap justify-center gap-3 pt-1">
                {canStart && (
                    <Button
                        type="button"
                        onClick={() => void startCapture()}
                    >
                        <Mic className="size-4" />
                        Start recording
                    </Button>
                )}

                {isRecording && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void finishCapture()}
                    >
                        <Square className="size-4" />
                        Stop
                    </Button>
                )}

                {(isRecording ||
                    phase === "requesting_microphone" ||
                    phase === "processing") && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={cancelCapture}
                        >
                            Cancel
                        </Button>
                    )}

                {phase === "transcript_ready" && (
                    <Button type="button" onClick={onComplete}>
                        Done
                    </Button>
                )}
            </div>
        </div>
    );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
        }

        const timeoutId = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);

        const onAbort = () => {
            clearTimeout(timeoutId);
            reject(new DOMException("Aborted", "AbortError"));
        };

        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
