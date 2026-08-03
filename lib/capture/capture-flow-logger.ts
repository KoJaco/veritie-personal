"use client";

import { logger } from "@/lib/logging/client-logger";

const PREFIX = "[capture-flow]";

function formatStep(step: string): string {
    return `${PREFIX} ${step}`;
}

export type CaptureFlowDiagnostics = {
    jobId?: string;
    sessionId?: string;
    leasePhase?: string;
    recorderMimeType?: string;
    recorderState?: string;
    recordingDurationMs?: number;
    dataAvailableEvents?: number;
    dataAvailableEmpty?: number;
    dataAvailableBytes?: number;
    chunksSent?: number;
    chunksBytesSent?: number;
    chunkSequenceAtEnd?: number;
    uploadChainSettled?: boolean;
};

export const captureFlowLog = {
    debug(step: string, context?: Record<string, unknown>): void {
        logger.debug(formatStep(step), context);
    },
    info(step: string, context?: Record<string, unknown>): void {
        logger.info(formatStep(step), context);
    },
    warn(step: string, context?: Record<string, unknown>): void {
        logger.warn(formatStep(step), context);
    },
    error(step: string, context?: Record<string, unknown>): void {
        logger.error(formatStep(step), context);
    },
    snapshot(step: string, diagnostics: CaptureFlowDiagnostics): void {
        logger.info(formatStep(step), diagnostics);
    },
};

/** Allow final MediaRecorder dataavailable handlers to run after stop. */
export async function flushPendingChunkUploads(
    uploadChain: Promise<void>,
): Promise<void> {
    await new Promise<void>((resolve) => {
        queueMicrotask(() => {
            setTimeout(resolve, 0);
        });
    });
    await uploadChain;
}
