import "server-only";

import type { JobDetailResponse } from "@veritie/sdk/client";
import { hasPendingJobEnrichment } from "@veritie/sdk/client";
import {
    enrichCaptureFromVeritieJob,
    persistCaptureFromVeritieJob,
    type EnrichCaptureFromJobResult,
    type PersistCaptureFromJobResult,
} from "@/lib/capture/persist-capture-from-job";
import { getServerVeritieClient } from "@/lib/veritie/server-client";
import { captureFlowServerLog } from "@/lib/capture/capture-flow-server-logger";

const MAX_SERVER_ENRICHMENT_POLLS = 120;
const SERVER_ENRICHMENT_POLL_INTERVAL_MS = 1500;
const SERVER_ENRICH_MAX_RETRIES = 3;
const SERVER_ENRICH_RETRY_DELAY_MS = 2000;

type CompleteCaptureFromJobResult = {
    persisted: PersistCaptureFromJobResult;
    enriched: EnrichCaptureFromJobResult;
};

const inFlightCompletions = new Map<string, Promise<CompleteCaptureFromJobResult>>();

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function isEnrichmentPending(job: JobDetailResponse): boolean {
    try {
        return hasPendingJobEnrichment(job);
    } catch (error) {
        captureFlowServerLog.warn("complete.pending_check_failed", {
            jobId: job.job_id,
            error: error instanceof Error ? error.message : String(error),
        });
        return true;
    }
}

async function waitForJobEnrichment(jobId: string): Promise<void> {
    const veritie = getServerVeritieClient();
    let job = await veritie.getJob(jobId);
    let polls = 0;

    while (isEnrichmentPending(job) && polls < MAX_SERVER_ENRICHMENT_POLLS) {
        await sleep(SERVER_ENRICHMENT_POLL_INTERVAL_MS);
        job = await veritie.getJob(jobId);
        polls += 1;
    }

    if (isEnrichmentPending(job)) {
        captureFlowServerLog.warn("complete.enrichment_poll_timeout", {
            jobId,
            polls,
            status: job.status,
            extractionState: job.extraction_state,
            indexingState: job.indexing_state,
        });
    }
}

async function runCaptureCompletion(
    jobId: string,
): Promise<CompleteCaptureFromJobResult> {
    captureFlowServerLog.info("complete.start", { jobId });

    const persisted = await persistCaptureFromVeritieJob(jobId);
    await waitForJobEnrichment(jobId);

    let enriched: EnrichCaptureFromJobResult | null = null;
    for (let attempt = 1; attempt <= SERVER_ENRICH_MAX_RETRIES; attempt += 1) {
        try {
            enriched = await enrichCaptureFromVeritieJob(jobId);
            break;
        } catch (error) {
            if (attempt >= SERVER_ENRICH_MAX_RETRIES) {
                throw error;
            }

            captureFlowServerLog.warn("complete.enrich_retry", {
                jobId,
                attempt,
                error: error instanceof Error ? error.message : String(error),
            });
            await sleep(SERVER_ENRICH_RETRY_DELAY_MS * attempt);
            await waitForJobEnrichment(jobId);
        }
    }

    if (!enriched) {
        throw new Error("Capture completion did not enrich");
    }

    captureFlowServerLog.info("complete.done", {
        jobId,
        captureId: enriched.captureId,
        timelineEventCount: enriched.timelineEventCount,
        extractedValueCount: enriched.extractedValueCount,
    });

    return { persisted, enriched };
}

export function completeCaptureFromVeritieJob(
    jobId: string,
): Promise<CompleteCaptureFromJobResult> {
    const existing = inFlightCompletions.get(jobId);
    if (existing) {
        captureFlowServerLog.debug("complete.duplicate", { jobId });
        return existing;
    }

    const completion = runCaptureCompletion(jobId).finally(() => {
        inFlightCompletions.delete(jobId);
    });
    inFlightCompletions.set(jobId, completion);
    return completion;
}

/** Test helper */
export function resetCaptureCompletionForTests(): void {
    inFlightCompletions.clear();
}
