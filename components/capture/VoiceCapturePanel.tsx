"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, Square } from "lucide-react";
import type { useVeritie } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";
import { Button } from "@/components/ui/button";
import { LiveAudioWaveform } from "./LiveAudioWaveform";
import { SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

type VeritieHook = ReturnType<typeof useVeritie>;

type VoicePhase =
    | "ready"
    | "requesting_microphone"
    | "recording"
    | "processing"
    | "transcript_ready"
    | "failed";

export function VoiceCapturePanel({
    veritie,
    embedded = true,
    onBack,
    onComplete,
}: {
    veritie: VeritieHook;
    embedded?: boolean;
    onBack: () => void;
    onComplete: () => void;
}) {
    const [phase, setPhase] = useState<VoicePhase>("ready");
    const [error, setError] = useState<string | null>(null);
    const [statusLine, setStatusLine] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const stopLocalRecording = useCallback(() => {
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

    const startCapture = useCallback(async () => {
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setPhase("requesting_microphone");

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Microphone not available in this browser.");
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
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
                setError("Recording failed.");
                setPhase("failed");
                stopLocalRecording();
            };

            recorder.start(250);
            recorderRef.current = recorder;
            setPhase("recording");
        } catch (captureError) {
            stopLocalRecording();
            setError(
                captureError instanceof Error
                    ? captureError.message
                    : "Could not access microphone.",
            );
            setPhase("failed");
        }
    }, [stopLocalRecording]);

    const finishCapture = useCallback(async () => {
        const recorder = recorderRef.current;
        if (!recorder || phase !== "recording") {
            return;
        }

        setPhase("processing");
        setStatusLine("Finishing recording…");

        try {
            await new Promise<void>((resolve, reject) => {
                recorder.addEventListener("stop", () => resolve(), { once: true });
                recorder.addEventListener("error", () => reject(new Error("Recording failed")), {
                    once: true,
                });
                recorder.stop();
            });

            stopLocalRecording();

            const blob = new Blob(chunksRef.current, {
                type: recorder.mimeType || "audio/webm",
            });
            if (blob.size === 0) {
                throw new Error("No audio was captured.");
            }

            const captureId = `capture_${Date.now()}`;
            setStatusLine("Uploading to Veritie…");

            const result = await veritie.createAndUploadJob({
                create: {
                    audio_content_type: blob.type || "audio/webm",
                },
                file: blob,
            });

            let job = await veritie.getJob(result.job.job_id);
            setStatusLine("Waiting for extraction…");
            let polls = 0;
            while (hasPendingJobEnrichment(job) && polls < 40) {
                await sleep(1500);
                job = await veritie.getJob(result.job.job_id);
                polls += 1;
            }

            setStatusLine("Saving capture…");
            await fetch("/api/captures", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job, captureId }),
            });

            const transcriptText = job.transcript?.text?.trim();
            if (transcriptText) {
                setTranscript(transcriptText);
            }
            setPhase("transcript_ready");
            setStatusLine(null);
        } catch (captureError) {
            stopLocalRecording();
            setError(
                captureError instanceof Error
                    ? captureError.message
                    : "Capture failed.",
            );
            setPhase("failed");
            setStatusLine(null);
        }
    }, [phase, stopLocalRecording, veritie]);

    const cancelCapture = useCallback(() => {
        stopLocalRecording();
        chunksRef.current = [];
        setError(null);
        setStatusLine(null);
        setTranscript(null);
        setPhase("ready");
    }, [stopLocalRecording]);

    const waveformMode =
        phase === "recording"
            ? "active"
            : phase === "processing" || phase === "requesting_microphone"
              ? "passive"
              : "idle";

    const isRecording = phase === "recording";
    const canStart = phase === "ready" || phase === "failed";

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

            {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <p className="font-medium">Voice log unavailable</p>
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
                        disabled={phase === "processing"}
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

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
