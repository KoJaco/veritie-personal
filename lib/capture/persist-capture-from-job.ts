import { randomUUID } from "crypto";
import {
    capturesPersistRequestSchema,
    veritieJobPersistSchema,
} from "@/lib/capture/captures-persist-schema";
import { mapVeritieJobToCaptureBundle } from "@/lib/capture/map-veritie-job";
import { envServer } from "@/lib/config/env.server";
import {
    appendCaptureFromJob,
    findCaptureByVeritieJobId,
    mergeCaptureEnrichment,
} from "@/lib/data-source/captures-read-model";
import { appendTimelineEvents } from "@/lib/data-source/timeline-read-model";
import { getServerVeritieClient } from "@/lib/veritie/server-client";
import { logger } from "@/lib/logging/server-logger";
import { captureFlowServerLog } from "@/lib/capture/capture-flow-server-logger";

export type PersistCaptureFromJobResult = {
    captureId: string;
    timelineEventCount: number;
    duplicate?: boolean;
};

export type EnrichCaptureFromJobResult = {
    captureId: string;
    timelineEventCount: number;
    extractedValueCount: number;
};

export async function persistCaptureFromVeritieJob(
    jobId: string,
): Promise<PersistCaptureFromJobResult> {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Capture persistence is not available in this environment");
    }

    const requestResult = capturesPersistRequestSchema.safeParse({ jobId });
    if (!requestResult.success) {
        throw new Error("Invalid job id");
    }

    const validatedJobId = requestResult.data.jobId;

    captureFlowServerLog.info("persist.fetch_job.start", { jobId: validatedJobId });

    const existing = findCaptureByVeritieJobId(validatedJobId);
    if (existing) {
        captureFlowServerLog.info("persist.duplicate", {
            jobId: validatedJobId,
            captureId: existing.id,
        });
        return {
            captureId: existing.id,
            timelineEventCount: 0,
            duplicate: true,
        };
    }

    const veritie = getServerVeritieClient();
    const job = await veritie.getJob(validatedJobId);

    captureFlowServerLog.debug("persist.fetch_job.done", {
        jobId: validatedJobId,
        status: job.status,
        hasTranscript: Boolean(job.transcript?.text),
        hasExtraction: Boolean(job.extraction),
        hasIndex: Boolean(job.index),
        transcriptState: job.transcript_state,
        extractionState: job.extraction_state,
        indexingState: job.indexing_state,
    });

    const jobResult = veritieJobPersistSchema.safeParse(job);
    if (!jobResult.success) {
        logger.error("[captures] invalid_job_payload", {
            jobId: validatedJobId,
            issues: jobResult.error.flatten(),
        });
        captureFlowServerLog.error("persist.validation_failed", {
            jobId: validatedJobId,
            issues: jobResult.error.flatten(),
        });
        throw new Error("Invalid job payload from Veritie");
    }

    const captureId = `capture_${randomUUID()}`;
    const bundle = mapVeritieJobToCaptureBundle(jobResult.data, captureId);
    appendCaptureFromJob({
        capture: bundle.capture,
        voiceLog: bundle.voiceLog,
        segments: bundle.segments,
        extractedValues: bundle.extractedValues,
    });
    appendTimelineEvents(bundle.timelineEvents);

    captureFlowServerLog.info("persist.saved", {
        jobId: validatedJobId,
        captureId: bundle.capture.id,
        timelineEventCount: bundle.timelineEvents.length,
        extractedValueCount: bundle.extractedValues.length,
    });

    return {
        captureId: bundle.capture.id,
        timelineEventCount: bundle.timelineEvents.length,
    };
}

export async function enrichCaptureFromVeritieJob(
    jobId: string,
): Promise<EnrichCaptureFromJobResult> {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Capture persistence is not available in this environment");
    }

    const requestResult = capturesPersistRequestSchema.safeParse({ jobId });
    if (!requestResult.success) {
        throw new Error("Invalid job id");
    }

    const validatedJobId = requestResult.data.jobId;
    const existing = findCaptureByVeritieJobId(validatedJobId);
    if (!existing) {
        throw new Error("Capture not found for enrichment");
    }

    captureFlowServerLog.info("enrich.fetch_job.start", {
        jobId: validatedJobId,
        captureId: existing.id,
    });

    const veritie = getServerVeritieClient();
    const job = await veritie.getJob(validatedJobId);

    const jobResult = veritieJobPersistSchema.safeParse(job);
    if (!jobResult.success) {
        logger.error("[captures] invalid_job_payload_enrich", {
            jobId: validatedJobId,
            issues: jobResult.error.flatten(),
        });
        captureFlowServerLog.error("enrich.validation_failed", {
            jobId: validatedJobId,
            issues: jobResult.error.flatten(),
        });
        throw new Error("Invalid job payload from Veritie");
    }

    const bundle = mapVeritieJobToCaptureBundle(jobResult.data, existing.id);
    const status =
        jobResult.data.status === "completed" ? "completed" : "processing";

    mergeCaptureEnrichment({
        captureId: existing.id,
        status,
        extractedValues: bundle.extractedValues,
        timelineEvents: bundle.timelineEvents,
    });

    captureFlowServerLog.info("enrich.saved", {
        jobId: validatedJobId,
        captureId: existing.id,
        timelineEventCount: bundle.timelineEvents.length,
        extractedValueCount: bundle.extractedValues.length,
    });

    return {
        captureId: existing.id,
        timelineEventCount: bundle.timelineEvents.length,
        extractedValueCount: bundle.extractedValues.length,
    };
}
