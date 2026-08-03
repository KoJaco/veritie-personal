"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, Square } from "lucide-react";
import type { useVeritie } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LiveAudioWaveform } from "@/components/capture/LiveAudioWaveform";
import { persistCaptureForVoiceFlow } from "@/lib/capture/persist-capture-client";
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
    | "save_failed"
    | "failed";

type PersistCaptureResult = {
    captureId: string;
    timelineEventCount: number;
};

export function VoiceCapturePanel({
    veritie,
    embedded = true,
    onBack,
    onComplete,
    persistCaptureFn = persistCaptureForVoiceFlow,
}: {
    veritie: VeritieHook;
    embedded?: boolean;
    onBack: () => void;
    onComplete: () => void;
    /** Override for tests; production uses server action via persistCaptureForVoiceFlow. */
    persistCaptureFn?: (jobId: string) => Promise<PersistCaptureResult>;
}) {
    const [phase, setPhase] = useState<VoicePhase>("ready");
    const [error, setError] = useState<string | null>(null);
    const [statusLine, setStatusLine] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [pendingJobId, setPendingJobId] = useState<string | null>(null);
    const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingStartedAtRef = useRef<number | null>(null);
    const finishCaptureRef = useRef<(() => Promise<void>) | null>(null);

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

    const abortInFlightWork = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortInFlightWork();
            stopLocalRecording();
        };
    }, [abortInFlightWork, stopLocalRecording]);

    const persistCapture = useCallback(async (jobId: string, signal: AbortSignal) => {
        if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
        }

        const abortPromise = new Promise<never>((_, reject) => {
            const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
            if (signal.aborted) {
                onAbort();
                return;
            }
            signal.addEventListener("abort", onAbort, { once: true });
        });

        return Promise.race([persistCaptureFn(jobId), abortPromise]);
    }, [persistCaptureFn]);

    const retrySave = useCallback(async () => {
        if (!pendingJobId) return;

        const controller = new AbortController();
        abortRef.current = controller;
        setError(null);
        setStatusLine("Saving capture…");
        setPhase("processing");

        try {
            await persistCapture(pendingJobId, controller.signal);
            if (!mountedRef.current || controller.signal.aborted) return;
            setPhase("transcript_ready");
            setStatusLine(null);
            setPendingJobId(null);
        } catch (saveError) {
            if (!mountedRef.current || controller.signal.aborted) return;
            const message =
                saveError instanceof Error
                    ? saveError.message
                    : "Failed to save capture";
            setError(message);
            setPhase("save_failed");
            setStatusLine(null);
            toast.error("Transcript ready but not saved", { description: message });
        }
    }, [pendingJobId, persistCapture]);

    const startCapture = useCallback(async () => {
        abortInFlightWork();
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setPendingJobId(null);
        setPhase("requesting_microphone");

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Microphone not available in this browser.");
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            if (!mountedRef.current || controller.signal.aborted) {
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

            chunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            recorder.onerror = () => {
                if (!mountedRef.current) return;
                setError("Recording failed.");
                setPhase("failed");
                stopLocalRecording();
            };

            recorder.start(250);
            recorderRef.current = recorder;
            recordingStartedAtRef.current = Date.now();
            recordingTimerRef.current = setInterval(() => {
                const startedAt = recordingStartedAtRef.current;
                if (!startedAt) return;
                const elapsed = Date.now() - startedAt;
                setRecordingElapsedMs(elapsed);
                if (elapsed >= MAX_RECORDING_MS) {
                    void finishCaptureRef.current?.();
                }
            }, 500);
            setPhase("recording");
        } catch (captureError) {
            if (!mountedRef.current || controller.signal.aborted) return;
            stopLocalRecording();
            setError(
                captureError instanceof Error
                    ? captureError.message
                    : "Could not access microphone.",
            );
            setPhase("failed");
        }
    }, [abortInFlightWork, stopLocalRecording]);

    const finishCapture = useCallback(async () => {
        const recorder = recorderRef.current;
        if (!recorder || phase !== "recording") {
            return;
        }

        abortInFlightWork();
        const controller = new AbortController();
        abortRef.current = controller;
        const { signal } = controller;

        setPhase("processing");
        setStatusLine("Finishing recording…");

        let jobIdForSave: string | null = null;
        let capturedTranscript: string | null = null;

        try {
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

            stopLocalRecording();

            const blob = new Blob(chunksRef.current, {
                type: recorder.mimeType || "audio/webm",
            });
            if (blob.size === 0) {
                throw new Error("No audio was captured.");
            }

            setStatusLine("Uploading to Veritie…");

            const result = await veritie.createAndUploadJob({
                create: {
                    audio_content_type: blob.type || "audio/webm",
                },
                file: blob,
                signal,
                upload: { signal },
            });

            if (!mountedRef.current || signal.aborted) return;

            const jobId = result.job.job_id;
            jobIdForSave = jobId;
            setPendingJobId(jobId);

            let job = await veritie.getJob(jobId, { signal });
            setStatusLine("Waiting for extraction…");
            let polls = 0;
            while (hasPendingJobEnrichment(job) && polls < 40) {
                if (!mountedRef.current || signal.aborted) return;
                await sleep(1500, signal);
                job = await veritie.getJob(jobId, { signal });
                polls += 1;
            }

            if (!mountedRef.current || signal.aborted) return;

            const transcriptText = job.transcript?.text?.trim();
            capturedTranscript = transcriptText ?? null;
            if (transcriptText) {
                setTranscript(transcriptText);
            }

            setStatusLine("Saving capture…");
            await persistCapture(jobId, signal);

            if (!mountedRef.current || signal.aborted) return;

            setPhase("transcript_ready");
            setStatusLine(null);
            setPendingJobId(null);
        } catch (captureError) {
            if (!mountedRef.current || signal.aborted) return;
            stopLocalRecording();

            if (jobIdForSave || capturedTranscript) {
                const message =
                    captureError instanceof Error
                        ? captureError.message
                        : "Failed to save capture";
                setError(message);
                setPhase("save_failed");
                setStatusLine(null);
                toast.error("Transcript ready but not saved", {
                    description: message,
                });
                return;
            }

            setError(
                captureError instanceof Error
                    ? captureError.message
                    : "Capture failed.",
            );
            setPhase("failed");
            setStatusLine(null);
        }
    }, [
        abortInFlightWork,
        persistCapture,
        phase,
        stopLocalRecording,
        veritie,
    ]);

    finishCaptureRef.current = finishCapture;

    const cancelCapture = useCallback(() => {
        abortInFlightWork();
        stopLocalRecording();
        chunksRef.current = [];
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setPendingJobId(null);
        setPhase("ready");
    }, [abortInFlightWork, stopLocalRecording]);

    const waveformMode =
        phase === "recording"
            ? "active"
            : phase === "processing" || phase === "requesting_microphone"
              ? "passive"
              : "idle";

    const isRecording = phase === "recording";
    const canStart = phase === "ready" || phase === "failed";

    const recordingMinutes = Math.floor(recordingElapsedMs / 60_000);
    const recordingSeconds = Math.floor((recordingElapsedMs % 60_000) / 1000);

    return (
        <div
            className={cn(
                embedded ? SURFACE_CLASS_NESTED : "rounded-2xl border bg-card p-4",
                "w-full space-y-5",
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
                {phase === "save_failed" && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        Save failed
                    </span>
                )}
            </div>

            {phase !== "transcript_ready" && phase !== "save_failed" ? (
                <LiveAudioWaveform stream={stream} mode={waveformMode} />
            ) : null}

            {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <p className="font-medium">
                        {phase === "save_failed"
                            ? "Transcript ready but not saved"
                            : "Voice log unavailable"}
                    </p>
                    <p className="mt-1 text-destructive/90">{error}</p>
                </div>
            )}

            {statusLine && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {statusLine}
                </div>
            )}

            {transcript && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Transcript</p>
                    <p className="text-sm leading-6 text-foreground/80 whitespace-pre-wrap">
                        {transcript}
                    </p>
                </div>
            )}

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

                {phase === "save_failed" && (
                    <Button type="button" onClick={() => void retrySave()}>
                        Retry save
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
