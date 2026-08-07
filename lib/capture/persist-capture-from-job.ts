import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
    capturesPersistRequestSchema,
    buildVeritieJobPersistSchema,
} from "@/lib/capture/captures-persist-schema";
import { mapVeritieJobToCaptureBundle } from "@/lib/capture/map-veritie-job";
import { getServerPipelineExtractionConfig } from "@/lib/capture/server-pipeline-config";
import { buildJobAudioStoragePath } from "@/lib/capture/capture-audio-paths";
import { remapIndexArtifactSegmentIds } from "@/lib/capture/capture-segment-ids";
import { requireUser } from "@/lib/auth/require-user";
import { envServer } from "@/lib/config/env.server";
import {
    appendCaptureFromJob,
    findCaptureByVeritieJobId as findStubCaptureByVeritieJobId,
    mergeCaptureEnrichment as mergeStubCaptureEnrichment,
} from "@/lib/data-source/captures-read-model";
import { appendTimelineEvents } from "@/lib/data-source/timeline-read-model";
import { getDataSourceKind } from "@/lib/data-source/registry";
import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    findCaptureByVeritieJobId as findDbCaptureByVeritieJobId,
    mergeCaptureEnrichment as mergeDbCaptureEnrichment,
    persistCaptureBundle,
} from "@/lib/db/repositories/captures";
import {
    assertVeritieJobOwnedByAccount,
    isVeritieJobAccessError,
} from "@/lib/db/repositories/veritie-job-leases";
import { getServerVeritieClient } from "@/lib/veritie/server-client";
import { logger } from "@/lib/logging/server-logger";
import { captureFlowServerLog } from "@/lib/capture/capture-flow-server-logger";
import { toCapturePersistError } from "@/lib/db/format-schema-error";

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

function isBackendPersistence(): boolean {
    return getDataSourceKind() === "backend";
}

function assertStubCaptureMutationsAllowed(): void {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Capture persistence is not available in this environment");
    }
}

export async function persistCaptureFromVeritieJob(
    jobId: string,
): Promise<PersistCaptureFromJobResult> {
    const user = await requireUser();

    if (!isBackendPersistence()) {
        assertStubCaptureMutationsAllowed();
    }

    const requestResult = capturesPersistRequestSchema.safeParse({ jobId });
    if (!requestResult.success) {
        throw new Error("Invalid job id");
    }

    const validatedJobId = requestResult.data.jobId;
    const scope = isBackendPersistence() ? await requireAccountScope() : null;

    captureFlowServerLog.info("persist.fetch_job.start", { jobId: validatedJobId });

    const existing = scope
        ? await findDbCaptureByVeritieJobId(scope, validatedJobId)
        : findStubCaptureByVeritieJobId(validatedJobId);

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

    if (scope) {
        await assertVeritieJobOwnedByAccount(scope, validatedJobId);
    }

    const veritie = getServerVeritieClient();
    const extractionConfig = await getServerPipelineExtractionConfig(veritie);
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

    const jobResult = buildVeritieJobPersistSchema(
        extractionConfig.extractionListKeys,
    ).safeParse(job);
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
    const bundle = mapVeritieJobToCaptureBundle(
        jobResult.data,
        captureId,
        extractionConfig,
    );

    if (user.appConfig?.saveVoiceLogAudio && scope) {
        bundle.voiceLog.audioUri = buildJobAudioStoragePath(
            scope.accountId,
            scope.userId,
            validatedJobId,
        );
    }

    if (scope) {
        try {
            const persisted = await persistCaptureBundle(scope, bundle);
            if (persisted.duplicate) {
                captureFlowServerLog.info("persist.duplicate", {
                    jobId: validatedJobId,
                    captureId: persisted.capture.id,
                });
                return {
                    captureId: persisted.capture.id,
                    timelineEventCount: 0,
                    duplicate: true,
                };
            }
        } catch (error) {
            captureFlowServerLog.error("persist.db_failed", {
                jobId: validatedJobId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw toCapturePersistError(error);
        }
    } else {
        appendCaptureFromJob({
            capture: bundle.capture,
            voiceLog: bundle.voiceLog,
            segments: bundle.segments,
            extractedValues: bundle.extractedValues,
        });
        appendTimelineEvents(bundle.timelineEvents);
    }

    captureFlowServerLog.info("persist.saved", {
        jobId: validatedJobId,
        captureId: bundle.capture.id,
        timelineEventCount: bundle.timelineEvents.length,
        extractedValueCount: bundle.extractedValues.length,
    });

    revalidatePath("/captures");
    revalidatePath("/timeline");

    return {
        captureId: bundle.capture.id,
        timelineEventCount: bundle.timelineEvents.length,
    };
}

export async function enrichCaptureFromVeritieJob(
    jobId: string,
): Promise<EnrichCaptureFromJobResult> {
    await requireUser();

    if (!isBackendPersistence()) {
        assertStubCaptureMutationsAllowed();
    }

    const requestResult = capturesPersistRequestSchema.safeParse({ jobId });
    if (!requestResult.success) {
        throw new Error("Invalid job id");
    }

    const validatedJobId = requestResult.data.jobId;
    const scope = isBackendPersistence() ? await requireAccountScope() : null;

    const existing = scope
        ? await findDbCaptureByVeritieJobId(scope, validatedJobId)
        : findStubCaptureByVeritieJobId(validatedJobId);

    if (!existing) {
        throw new Error("Capture not found for enrichment");
    }

    if (scope) {
        await assertVeritieJobOwnedByAccount(scope, validatedJobId);
    }

    captureFlowServerLog.info("enrich.fetch_job.start", {
        jobId: validatedJobId,
        captureId: existing.id,
    });

    const veritie = getServerVeritieClient();
    const extractionConfig = await getServerPipelineExtractionConfig(veritie);
    const job = await veritie.getJob(validatedJobId);

    const jobResult = buildVeritieJobPersistSchema(
        extractionConfig.extractionListKeys,
    ).safeParse(job);
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

    const bundle = mapVeritieJobToCaptureBundle(
        jobResult.data,
        existing.id,
        extractionConfig,
    );
    const status =
        jobResult.data.status === "completed" ? "completed" : "processing";

    if (scope) {
        try {
            await mergeDbCaptureEnrichment(scope, {
                captureId: existing.id,
                status,
                title: bundle.capture.title,
                aspectIds: bundle.capture.aspectIds,
                extractedValues: bundle.extractedValues,
                timelineEvents: bundle.timelineEvents,
                voiceLogArtifacts: {
                    indexArtifact: remapIndexArtifactSegmentIds(
                        jobResult.data.index ?? null,
                        existing.id,
                    ) as Record<string, unknown> | null,
                    extractionPayload: jobResult.data.extraction?.payload ?? null,
                },
            });
        } catch (error) {
            captureFlowServerLog.error("enrich.db_failed", {
                jobId: validatedJobId,
                captureId: existing.id,
                error: error instanceof Error ? error.message : String(error),
            });
            throw toCapturePersistError(error);
        }
    } else {
        mergeStubCaptureEnrichment({
            captureId: existing.id,
            status,
            title: bundle.capture.title,
            aspectIds: bundle.capture.aspectIds,
            extractedValues: bundle.extractedValues,
            timelineEvents: bundle.timelineEvents,
            voiceLogArtifacts: {
                indexArtifact: remapIndexArtifactSegmentIds(
                    jobResult.data.index ?? null,
                    existing.id,
                ) as Record<string, unknown> | null,
                extractionPayload: jobResult.data.extraction?.payload ?? null,
            },
        });
    }

    captureFlowServerLog.info("enrich.saved", {
        jobId: validatedJobId,
        captureId: existing.id,
        timelineEventCount: bundle.timelineEvents.length,
        extractedValueCount: bundle.extractedValues.length,
    });

    revalidatePath("/captures");
    revalidatePath("/timeline");
    revalidatePath(`/captures/${existing.id}`);

    return {
        captureId: existing.id,
        timelineEventCount: bundle.timelineEvents.length,
        extractedValueCount: bundle.extractedValues.length,
    };
}
