"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Square } from "lucide-react";
import { hasPendingJobEnrichment } from "@veritie/sdk";

import { IndexedResultSurface } from "@/components/capture/indexed-result";
import { LiveAudioWaveform } from "@/components/capture/LiveAudioWaveform";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mapJobToIndexedProps } from "@/lib/capture/map-job-to-indexed-props";
import {
    buildVoiceCaptureStubCompleteJob,
    buildVoiceCaptureStubExtractionJob,
    buildVoiceCaptureStubTranscriptJob,
    VOICE_CAPTURE_SANDBOX_AUDIO_URL,
    VOICE_CAPTURE_SANDBOX_TRANSCRIPT,
} from "@/lib/capture/voice-capture-flow-stub";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

/** Staged delays between sandbox phases (ms). */
export const VOICE_CAPTURE_SANDBOX_DELAYS = {
    requestingMicrophone: 700,
    recording: 4500,
    processing: 2800,
    transcriptReady: 2200,
    extractionReady: 2800,
    indexing: 3200,
} as const;

type SandboxPhase =
    | "idle"
    | "requesting_microphone"
    | "recording"
    | "processing"
    | "transcript_ready"
    | "extraction_ready"
    | "indexing"
    | "complete";

const PHASE_LABELS: Record<SandboxPhase, string> = {
    idle: "Idle",
    requesting_microphone: "Requesting microphone",
    recording: "Recording",
    processing: "Processing",
    transcript_ready: "Transcript ready",
    extraction_ready: "Extraction ready",
    indexing: "Indexing",
    complete: "Indexed complete",
};

export function VoiceCaptureFlowSandbox() {
    const [phase, setPhase] = useState<SandboxPhase>("idle");
    const [statusLine, setStatusLine] = useState<string | null>(null);
    const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
    const [expectAudio, setExpectAudio] = useState(false);
    const timeoutIdsRef = useRef<number[]>([]);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingStartedAtRef = useRef<number | null>(null);

    const clearScheduledSteps = useCallback(() => {
        for (const timeoutId of timeoutIdsRef.current) {
            window.clearTimeout(timeoutId);
        }
        timeoutIdsRef.current = [];
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        recordingStartedAtRef.current = null;
        setRecordingElapsedMs(0);
    }, []);

    const schedule = useCallback((delayMs: number, step: () => void) => {
        const timeoutId = window.setTimeout(step, delayMs);
        timeoutIdsRef.current.push(timeoutId);
    }, []);

    const reset = useCallback(() => {
        clearScheduledSteps();
        setPhase("idle");
        setStatusLine(null);
        setExpectAudio(false);
    }, [clearScheduledSteps]);

    const start = useCallback(() => {
        reset();
        setPhase("requesting_microphone");
        setStatusLine("Opening live session…");

        schedule(VOICE_CAPTURE_SANDBOX_DELAYS.requestingMicrophone, () => {
            setStatusLine(null);
            setPhase("recording");
            recordingStartedAtRef.current = Date.now();
            recordingTimerRef.current = setInterval(() => {
                const startedAt = recordingStartedAtRef.current;
                if (!startedAt) {
                    return;
                }
                setRecordingElapsedMs(Date.now() - startedAt);
            }, 250);
        });

        schedule(
            VOICE_CAPTURE_SANDBOX_DELAYS.requestingMicrophone +
                VOICE_CAPTURE_SANDBOX_DELAYS.recording,
            () => {
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }
                setPhase("processing");
                setStatusLine("Waiting for transcript…");
            },
        );

        schedule(
            VOICE_CAPTURE_SANDBOX_DELAYS.requestingMicrophone +
                VOICE_CAPTURE_SANDBOX_DELAYS.recording +
                VOICE_CAPTURE_SANDBOX_DELAYS.processing,
            () => {
                setPhase("transcript_ready");
                setStatusLine(null);
                setExpectAudio(true);
            },
        );

        schedule(
            VOICE_CAPTURE_SANDBOX_DELAYS.requestingMicrophone +
                VOICE_CAPTURE_SANDBOX_DELAYS.recording +
                VOICE_CAPTURE_SANDBOX_DELAYS.processing +
                VOICE_CAPTURE_SANDBOX_DELAYS.transcriptReady,
            () => {
                setPhase("extraction_ready");
            },
        );

        schedule(
            VOICE_CAPTURE_SANDBOX_DELAYS.requestingMicrophone +
                VOICE_CAPTURE_SANDBOX_DELAYS.recording +
                VOICE_CAPTURE_SANDBOX_DELAYS.processing +
                VOICE_CAPTURE_SANDBOX_DELAYS.transcriptReady +
                VOICE_CAPTURE_SANDBOX_DELAYS.extractionReady,
            () => {
                setPhase("indexing");
            },
        );

        schedule(
            VOICE_CAPTURE_SANDBOX_DELAYS.requestingMicrophone +
                VOICE_CAPTURE_SANDBOX_DELAYS.recording +
                VOICE_CAPTURE_SANDBOX_DELAYS.processing +
                VOICE_CAPTURE_SANDBOX_DELAYS.transcriptReady +
                VOICE_CAPTURE_SANDBOX_DELAYS.extractionReady +
                VOICE_CAPTURE_SANDBOX_DELAYS.indexing,
            () => {
                setPhase("complete");
            },
        );
    }, [reset, schedule]);

    useEffect(() => {
        return () => {
            clearScheduledSteps();
        };
    }, [clearScheduledSteps]);

    const transcriptJob =
        phase === "transcript_ready"
            ? buildVoiceCaptureStubTranscriptJob()
            : null;
    const extractionJob =
        phase === "extraction_ready" || phase === "indexing"
            ? buildVoiceCaptureStubExtractionJob()
            : null;
    const completeJob =
        phase === "complete" ? buildVoiceCaptureStubCompleteJob() : null;

    const activeJob = completeJob ?? extractionJob ?? transcriptJob;
    const transcriptText =
        phase === "transcript_ready" ||
        phase === "extraction_ready" ||
        phase === "indexing" ||
        phase === "complete"
            ? VOICE_CAPTURE_SANDBOX_TRANSCRIPT
            : null;

    const audioUrl =
        phase === "complete" && expectAudio
            ? VOICE_CAPTURE_SANDBOX_AUDIO_URL
            : null;

    const indexedProps = activeJob
        ? mapJobToIndexedProps(activeJob, audioUrl)
        : null;

    const showIndexedSurface =
        (phase === "extraction_ready" ||
            phase === "indexing" ||
            phase === "complete") &&
        indexedProps !== null;

    const showPlainTranscript =
        phase === "transcript_ready" && transcriptText !== null;

    const indexingPending =
        activeJob !== null && hasPendingJobEnrichment(activeJob);

    const waveformMode =
        phase === "recording"
            ? "passive"
            : phase === "processing" || phase === "requesting_microphone"
              ? "passive"
              : "idle";

    const isRunning = phase !== "idle";
    const recordingMinutes = Math.floor(recordingElapsedMs / 60_000);
    const recordingSeconds = Math.floor((recordingElapsedMs % 60_000) / 1000);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={start} disabled={isRunning}>
                    Start flow
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={!isRunning && phase === "idle"}
                >
                    Reset
                </Button>
                <Badge variant="outline">{PHASE_LABELS[phase]}</Badge>
                {phase === "transcript_ready" && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Transcript ready
                    </span>
                )}
                {phase === "complete" && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Indexed complete
                    </span>
                )}
            </div>

            <div
                className={cn(
                    SURFACE_CLASS,
                    "mx-auto w-full max-w-2xl space-y-3 p-4",
                    phase === "processing" && "animate-pulse",
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Voice capture sandbox</p>
                    {phase === "recording" && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                            {recordingMinutes}:
                            {recordingSeconds.toString().padStart(2, "0")}
                        </span>
                    )}
                    {phase === "processing" && (
                        <span className="text-xs font-medium text-muted-foreground animate-pulse">
                            Processing…
                        </span>
                    )}
                </div>

                {phase !== "transcript_ready" &&
                phase !== "extraction_ready" &&
                phase !== "indexing" &&
                phase !== "complete" ? (
                    <LiveAudioWaveform stream={null} mode={waveformMode} />
                ) : null}

                {statusLine ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        {statusLine}
                    </div>
                ) : null}

                {phase === "recording" && (
                    <div className="flex justify-center">
                        <Button type="button" variant="destructive" disabled>
                            <Square className="size-4" />
                            Stop
                        </Button>
                    </div>
                )}

                {showPlainTranscript && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Transcript</p>
                        <p className="text-sm leading-6 text-foreground/80 whitespace-pre-wrap">
                            {transcriptText}
                        </p>
                    </div>
                )}

                {showIndexedSurface && indexedProps ? (
                    <div className={cn(SURFACE_CLASS_NESTED, "rounded-xl p-3")}>
                        <IndexedResultSurface
                            {...indexedProps}
                            layout="embedded"
                            expectAudio={expectAudio}
                            showIndexingBanner
                            indexingState={activeJob?.indexing_state ?? null}
                        />
                        {indexingPending ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Indexing extraction in the background…
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {phase === "idle" && (
                    <p className="text-sm text-muted-foreground">
                        Press Start flow to simulate recording → transcript →
                        extraction → indexed evidence. Uses morning voice log stub
                        data.
                    </p>
                )}
            </div>

            <section className={cn(SURFACE_CLASS_NESTED, "rounded-xl p-4 text-sm")}>
                <p className="font-medium">Step timing (ms)</p>
                <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
                    {Object.entries(VOICE_CAPTURE_SANDBOX_DELAYS).map(
                        ([key, delay]) => (
                            <li key={key}>
                                {key}: {delay}
                            </li>
                        ),
                    )}
                </ul>
            </section>
        </div>
    );
}
