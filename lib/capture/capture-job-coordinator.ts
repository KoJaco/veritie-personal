import type { JobDetailResponse } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";
import { toast } from "sonner";
import { captureFlowLog } from "@/lib/capture/capture-flow-logger";
import { enrichCaptureForVoiceFlow } from "@/lib/capture/persist-capture-client";

export const MAX_ENRICHMENT_POLLS = 120;
export const ENRICHMENT_POLL_INTERVAL_MS = 1500;
const ENRICH_MAX_RETRIES = 3;
const ENRICH_RETRY_DELAY_MS = 2000;

export type CaptureJobEvent =
    | {
          type: "capture:job-update";
          jobId: string;
          job: JobDetailResponse;
      }
    | {
          type: "capture:persisted";
          jobId: string;
          captureId: string;
          timelineEventCount: number;
      }
    | {
          type: "capture:enriched";
          jobId: string;
          captureId: string;
          timelineEventCount: number;
          extractedValueCount: number;
      }
    | {
          type: "capture:failed";
          jobId: string;
          stage: "persist" | "enrich";
          error: string;
      };

export type CaptureJobCoordinatorInput = {
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
    onJobUpdate?: (job: JobDetailResponse) => void;
    onPersisted?: (result: {
        captureId: string;
        timelineEventCount: number;
    }) => void;
    onEnriched?: (result: {
        captureId: string;
        timelineEventCount: number;
        extractedValueCount: number;
    }) => void;
    onPersistError?: (error: unknown) => void;
    onEnrichError?: (error: unknown) => void;
    uploadAudioFn?: (
        captureId: string,
        audioBlob: Blob,
    ) => Promise<void>;
    audioBlob?: Blob | null;
};

type Listener = (event: CaptureJobEvent) => void;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function isEnrichmentPending(job: JobDetailResponse): boolean {
    try {
        return hasPendingJobEnrichment(job);
    } catch (error) {
        captureFlowLog.warn("coordinator.enrich.pending_check_failed", {
            jobId: job.job_id,
            error: error instanceof Error ? error.message : String(error),
        });
        return true;
    }
}

class CaptureJobCoordinatorImpl {
    private inFlightJobIds = new Set<string>();
    private listeners = new Set<Listener>();

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    isJobInFlight(jobId: string): boolean {
        return this.inFlightJobIds.has(jobId);
    }

    hasInFlightJobs(): boolean {
        return this.inFlightJobIds.size > 0;
    }

    private emit(event: CaptureJobEvent): void {
        for (const listener of this.listeners) {
            try {
                listener(event);
            } catch (error) {
                captureFlowLog.warn("coordinator.listener_error", {
                    type: event.type,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    start(input: CaptureJobCoordinatorInput): void {
        if (this.inFlightJobIds.has(input.jobId)) {
            captureFlowLog.debug("coordinator.start.duplicate", {
                jobId: input.jobId,
            });
            return;
        }

        this.inFlightJobIds.add(input.jobId);
        captureFlowLog.info("coordinator.start", { jobId: input.jobId });

        void this.run(input).finally(() => {
            this.inFlightJobIds.delete(input.jobId);
            captureFlowLog.info("coordinator.done", { jobId: input.jobId });
        });
    }

    private async run(input: CaptureJobCoordinatorInput): Promise<void> {
        const {
            jobId,
            veritie,
            persistCaptureFn,
            enrichCaptureFn = enrichCaptureForVoiceFlow,
            onJobUpdate,
            onPersisted,
            onEnriched,
            onPersistError,
            onEnrichError,
            uploadAudioFn,
            audioBlob,
        } = input;

        let captureId: string | null = null;

        try {
            captureFlowLog.info("coordinator.persist.start", { jobId });
            const persistResult = await persistCaptureFn(jobId);
            captureId = persistResult.captureId;
            captureFlowLog.info("coordinator.persist.success", {
                jobId,
                captureId,
            });
            onPersisted?.(persistResult);
            this.emit({
                type: "capture:persisted",
                jobId,
                captureId: persistResult.captureId,
                timelineEventCount: persistResult.timelineEventCount,
            });

            if (uploadAudioFn && audioBlob && audioBlob.size > 0) {
                try {
                    await uploadAudioFn(persistResult.captureId, audioBlob);
                    captureFlowLog.info("coordinator.audio.uploaded", {
                        jobId,
                        captureId: persistResult.captureId,
                    });
                } catch (audioError) {
                    captureFlowLog.error("coordinator.audio.failed", {
                        jobId,
                        captureId: persistResult.captureId,
                        error:
                            audioError instanceof Error
                                ? audioError.message
                                : String(audioError),
                    });
                }
            }
        } catch (error) {
            captureFlowLog.error("coordinator.persist.failed", {
                jobId,
                error: error instanceof Error ? error.message : String(error),
            });
            onPersistError?.(error);
            this.emit({
                type: "capture:failed",
                jobId,
                stage: "persist",
                error: error instanceof Error ? error.message : "Failed to save capture",
            });
            toast.error("Could not save capture", {
                description:
                    error instanceof Error ? error.message : "Failed to save capture",
            });
            return;
        }

        try {
            captureFlowLog.info("coordinator.enrich.poll.start", { jobId });
            let job = await veritie.getJob(jobId);
            let polls = 0;

            const notifyJobUpdate = (updatedJob: JobDetailResponse) => {
                onJobUpdate?.(updatedJob);
                this.emit({
                    type: "capture:job-update",
                    jobId,
                    job: updatedJob,
                });
            };

            notifyJobUpdate(job);

            while (isEnrichmentPending(job) && polls < MAX_ENRICHMENT_POLLS) {
                await sleep(ENRICHMENT_POLL_INTERVAL_MS);
                job = await veritie.getJob(jobId);
                polls += 1;
                notifyJobUpdate(job);
            }

            if (isEnrichmentPending(job)) {
                captureFlowLog.warn("coordinator.enrich.poll.timeout", {
                    jobId,
                    polls,
                    status: job.status,
                });
            }

            let enrichResult: {
                captureId: string;
                timelineEventCount: number;
                extractedValueCount: number;
            } | null = null;

            for (let attempt = 1; attempt <= ENRICH_MAX_RETRIES; attempt += 1) {
                try {
                    captureFlowLog.info("coordinator.enrich.start", {
                        jobId,
                        attempt,
                    });
                    enrichResult = await enrichCaptureFn(jobId);
                    break;
                } catch (enrichError) {
                    if (attempt >= ENRICH_MAX_RETRIES) {
                        throw enrichError;
                    }
                    captureFlowLog.warn("coordinator.enrich.retry", {
                        jobId,
                        attempt,
                        error:
                            enrichError instanceof Error
                                ? enrichError.message
                                : String(enrichError),
                    });
                    await sleep(ENRICH_RETRY_DELAY_MS * attempt);
                    job = await veritie.getJob(jobId);
                    notifyJobUpdate(job);
                }
            }

            if (!enrichResult) {
                throw new Error("Enrichment did not complete");
            }

            captureFlowLog.info("coordinator.enrich.success", {
                jobId,
                captureId: enrichResult.captureId,
                extractedValueCount: enrichResult.extractedValueCount,
            });
            onEnriched?.(enrichResult);
            this.emit({
                type: "capture:enriched",
                jobId,
                captureId: enrichResult.captureId,
                timelineEventCount: enrichResult.timelineEventCount,
                extractedValueCount: enrichResult.extractedValueCount,
            });
        } catch (error) {
            captureFlowLog.error("coordinator.enrich.failed", {
                jobId,
                captureId,
                error: error instanceof Error ? error.message : String(error),
            });
            onEnrichError?.(error);
            this.emit({
                type: "capture:failed",
                jobId,
                stage: "enrich",
                error:
                    error instanceof Error
                        ? error.message
                        : "Extraction could not be synced",
            });
            toast.error("Capture saved partially", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Extraction could not be synced",
            });
        }
    }

    /** Test helper */
    resetForTests(): void {
        this.inFlightJobIds.clear();
        this.listeners.clear();
    }
}

export const captureJobCoordinator = new CaptureJobCoordinatorImpl();
