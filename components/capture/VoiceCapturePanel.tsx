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
    prepareLeaseForRecording,
    renewLease,
    embedded = true,
    onBack,
    onComplete,
    saveVoiceLogAudio = false,
    captureLocationLabel = "",
    persistCaptureFn = persistCaptureForVoiceFlow,
}: {
    veritie: VeritieHook;
    captureHandle: PipelineHandle | null;
    leasePhase: CaptureLeasePhase;
    leaseError?: string | null;
    prepareLeaseForRecording: (
        metadata: CaptureJobMetadata,
    ) => Promise<PipelineHandle>;
    renewLease: () => void;
    embedded?: boolean;
    onBack: () => void;
    onComplete: () => void;
    saveVoiceLogAudio?: boolean;
    captureLocationLabel?: string;
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

    const stopLocalRecording = useCallback(() => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        recordingStartedAtRef.current = null;
        setRecordingElapsedMs(0);

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
    }, []);

    const closeLiveSession = useCallback(() => {
        const session = liveSessionRef.current;
        if (session && !session.closed) {
            session.close(1000, "capture cancelled");
        }
        liveSessionRef.current = null;
        chunkStreamStateRef.current = createLiveChunkStreamState();
        chunkSendChainRef.current = Promise.resolve();
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

    const startCapture = useCallback(async () => {
        if (leasePhase === "preparing") {
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
        setPhase("requesting_microphone");

        const openController = new AbortController();
        openAbortRef.current = openController;
        const { signal: openSignal } = openController;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Microphone not available in this browser.");
            }

            setStatusLine("Preparing capture session…");
            const metadata = buildCaptureJobMetadata({
                capturedAt: new Date().toISOString(),
                locationLabel: captureLocationLabelRef.current,
            });
            const handle = await prepareLeaseForRecording(metadata);
            if (!mountedRef.current || openSignal.aborted) {
                handle.close();
                return;
            }

            activeCaptureHandleRef.current = handle;
            resetDiagnostics({
                jobId: handle.snapshot.jobId,
                leasePhase,
            });
            captureFlowLog.info("capture.start", {
                jobId: handle.snapshot.jobId,
                leasePhase,
                captured_at: metadata.captured_at,
            });

            setStatusLine("Opening live session…");
            const liveSession = await handle.startCapture({
                signal: openSignal,
            });
            if (!mountedRef.current || openSignal.aborted) {
                liveSession.close(1000, "aborted");
                return;
            }

            // Session is open — do not abort openSignal during finalize (closes WebSocket).
            openAbortRef.current = null;

            liveSessionRef.current = liveSession;
            diagnosticsRef.current.sessionId = liveSession.sessionId;
            chunkStreamStateRef.current = createLiveChunkStreamState();
            chunkSendChainRef.current = Promise.resolve();

            captureFlowLog.info("live.session.opened", {
                jobId: handle.snapshot.jobId,
                sessionId: liveSession.sessionId,
            });

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            if (!mountedRef.current || openSignal.aborted) {
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = mediaStream;
            setStream(mediaStream);

            const mimeType = MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "";
            const recorder = mimeType
                ? new MediaRecorder(mediaStream, { mimeType })
                : new MediaRecorder(mediaStream);
            diagnosticsRef.current.recorderMimeType = recorder.mimeType;

            recorder.ondataavailable = (event) => {
                diagnosticsRef.current.dataAvailableEvents =
                    (diagnosticsRef.current.dataAvailableEvents ?? 0) + 1;

                if (event.data.size === 0) {
                    diagnosticsRef.current.dataAvailableEmpty =
                        (diagnosticsRef.current.dataAvailableEmpty ?? 0) + 1;
                    captureFlowLog.debug("recorder.dataavailable.empty", {
                        jobId: handle.snapshot.jobId,
                        recorderState: recorder.state,
                    });
                    return;
                }

                if (!liveSessionRef.current) {
                    captureFlowLog.warn("recorder.dataavailable.no_session", {
                        jobId: handle.snapshot.jobId,
                        bytes: event.data.size,
                    });
                    return;
                }

                diagnosticsRef.current.dataAvailableBytes =
                    (diagnosticsRef.current.dataAvailableBytes ?? 0) + event.data.size;

                if (saveVoiceLogAudioRef.current) {
                    audioChunksRef.current.push(event.data);
                }

                captureFlowLog.debug("recorder.dataavailable", {
                    jobId: handle.snapshot.jobId,
                    bytes: event.data.size,
                    recorderState: recorder.state,
                });

                chunkSendChainRef.current = chunkSendChainRef.current
                    .then(async () => {
                        if (!liveSessionRef.current) return;
                        const before = chunkStreamStateRef.current;
                        chunkStreamStateRef.current = await sendLiveAudioChunk(
                            liveSessionRef.current,
                            chunkStreamStateRef.current,
                            event.data,
                        );
                        if (chunkStreamStateRef.current.sequence > before.sequence) {
                            diagnosticsRef.current.chunksSent =
                                chunkStreamStateRef.current.sequence;
                            diagnosticsRef.current.chunksBytesSent =
                                chunkStreamStateRef.current.offsetBytes;
                        }
                    })
                    .catch((chunkError) => {
                        captureFlowLog.error("chunk.send_failed", {
                            jobId: handle.snapshot.jobId,
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
                    });
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
            recordingStartedAtRef.current = Date.now();
            captureFlowLog.info("recorder.started", {
                jobId: handle.snapshot.jobId,
                mimeType: recorder.mimeType,
                timesliceMs: 250,
            });
            recordingTimerRef.current = setInterval(() => {
                const startedAt = recordingStartedAtRef.current;
                if (!startedAt) return;
                const elapsed = Date.now() - startedAt;
                setRecordingElapsedMs(elapsed);
                if (elapsed >= MAX_RECORDING_MS) {
                    void finishCaptureRef.current?.();
                }
            }, 500);
            setStatusLine(null);
            setPhase("recording");
        } catch (captureError) {
            if (!mountedRef.current || openController.signal.aborted) return;
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
        closeLiveSession,
        leasePhase,
        prepareLeaseForRecording,
        renewLease,
        stopLocalRecording,
        resetDiagnostics,
    ]);

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
        stopLocalRecording();
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setIndexedJob(null);
        setAudioPlaybackUrl(null);
        setActiveJobId(null);
        audioChunksRef.current = [];
        setPhase("ready");
        renewLease();
    }, [abortInFlightWork, renewLease, stopLocalRecording]);

    const waveformMode =
        phase === "recording"
            ? "active"
            : phase === "processing" || phase === "requesting_microphone"
                ? "passive"
                : "idle";

    const isRecording = phase === "recording";
    const canStart =
        (phase === "ready" || phase === "failed") && leasePhase !== "preparing";
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
                "w-full space-y-3",
                phase === "processing" && "animate-pulse",
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
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

            {phase !== "transcript_ready" ? (
                <LiveAudioWaveform stream={stream} mode={waveformMode} />
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
                <div className={cn(SURFACE_CLASS_NESTED, "rounded-xl p-3")}>
                    <IndexedResultSurface
                        {...indexedProps}
                        layout="embedded"
                        expectAudio={saveVoiceLogAudio}
                        showIndexingBanner
                        indexingState={indexedJob?.indexing_state ?? null}
                    />
                    {indexingPending ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Indexing extraction in the background…
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="flex flex-wrap justify-center gap-3">
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
