import type { JobDetailResponse } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";
import { toast } from "sonner";
import { captureFlowLog } from "@/lib/capture/capture-flow-logger";
import { enrichCaptureForVoiceFlow } from "@/lib/capture/persist-capture-client";

const MAX_ENRICHMENT_POLLS = 40;
const ENRICHMENT_POLL_INTERVAL_MS = 1500;

const inFlightJobIds = new Set<string>();

export type CaptureBackgroundPipelineInput = {
    jobId: string;
    veritie: {
        getJob: (
            jobId: string,
            options?: { signal?: AbortSignal },
        ) => Promise<JobDetailResponse>;
    };
    persistCaptureFn: (
        jobId: string,
    ) => Promise<{ captureId: string; timelineEventCount: number }>;
    enrichCaptureFn?: (
        jobId: string,
    ) => Promise<{
        captureId: string;
        timelineEventCount: number;
        extractedValueCount: number;
    }>;
    onPersistError?: (error: unknown) => void;
    onEnrichError?: (error: unknown) => void;
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function isEnrichmentPending(job: JobDetailResponse): boolean {
    try {
        return hasPendingJobEnrichment(job);
    } catch (error) {
        captureFlowLog.warn("background.enrich.pending_check_failed", {
            jobId: job.job_id,
            error: error instanceof Error ? error.message : String(error),
        });
        return true;
    }
}

async function runCaptureBackgroundPipeline(
    input: CaptureBackgroundPipelineInput,
): Promise<void> {
    const {
        jobId,
        veritie,
        persistCaptureFn,
        enrichCaptureFn = enrichCaptureForVoiceFlow,
        onPersistError,
        onEnrichError,
    } = input;

    try {
        captureFlowLog.info("background.persist.start", { jobId });
        await persistCaptureFn(jobId);
        captureFlowLog.info("background.persist.success", { jobId });
    } catch (error) {
        captureFlowLog.error("background.persist.failed", {
            jobId,
            error: error instanceof Error ? error.message : String(error),
        });
        onPersistError?.(error);
        toast.error("Could not save capture", {
            description:
                error instanceof Error ? error.message : "Failed to save capture",
        });
        return;
    }

    try {
        captureFlowLog.info("background.enrich.poll.start", { jobId });
        let job = await veritie.getJob(jobId);
        let polls = 0;

        while (isEnrichmentPending(job) && polls < MAX_ENRICHMENT_POLLS) {
            await sleep(ENRICHMENT_POLL_INTERVAL_MS);
            job = await veritie.getJob(jobId);
            polls += 1;
        }

        if (isEnrichmentPending(job)) {
            captureFlowLog.warn("background.enrich.poll.timeout", {
                jobId,
                polls,
                status: job.status,
            });
        }

        captureFlowLog.info("background.enrich.start", { jobId });
        const result = await enrichCaptureFn(jobId);
        captureFlowLog.info("background.enrich.success", {
            jobId,
            captureId: result.captureId,
            extractedValueCount: result.extractedValueCount,
        });
    } catch (error) {
        captureFlowLog.error("background.enrich.failed", {
            jobId,
            error: error instanceof Error ? error.message : String(error),
        });
        onEnrichError?.(error);
        toast.error("Capture saved partially", {
            description:
                error instanceof Error
                    ? error.message
                    : "Extraction could not be synced",
        });
    }
}

export function enqueueCaptureBackgroundPipeline(
    input: CaptureBackgroundPipelineInput,
): void {
    if (inFlightJobIds.has(input.jobId)) {
        captureFlowLog.debug("background.enqueue.duplicate", {
            jobId: input.jobId,
        });
        return;
    }

    inFlightJobIds.add(input.jobId);
    captureFlowLog.info("background.enqueue", { jobId: input.jobId });

    void runCaptureBackgroundPipeline(input).finally(() => {
        inFlightJobIds.delete(input.jobId);
    });
}

/** Test helper */
export function resetCaptureBackgroundPipelineForTests(): void {
    inFlightJobIds.clear();
}
