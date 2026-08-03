import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { JobDetailResponse } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";

import {
    enqueueCaptureBackgroundPipeline,
    resetCaptureBackgroundPipelineForTests,
} from "@/lib/capture/capture-background-pipeline";

jest.mock("sonner", () => ({
    toast: {
        error: jest.fn(),
    },
}));

function makeJob(
    overrides: Partial<JobDetailResponse> = {},
): JobDetailResponse {
    return {
        job_id: "job_bg",
        status: "completed",
        accepted_request: { audio_content_type: "audio/webm" },
        events: [],
        runtime: {
            overall: "completed",
            session_lease: {
                status: "consumed",
                attempt_count: 1,
                lease_version: "v0",
                ingest_mode: "live_first",
            },
            ingest: { status: "completed", attempt_count: 1 },
            transcript: { status: "completed", attempt_count: 1 },
            extraction: { status: "completed", attempt_count: 1 },
            source_audio: {
                status: "completed",
                attempt_count: 1,
                canonical_audio_state: "completed",
                integrity_state: "not_applicable",
            },
            indexing: { status: "completed", attempt_count: 1 },
            sink_deliveries: {
                status: "skipped",
                attempt_count: 0,
                skip_reason: "not_configured",
                failure_policy: "non_blocking",
            },
        } as JobDetailResponse["runtime"],
        ingest_mode: "live_first",
        canonical_audio_state: "completed",
        integrity_state: "not_applicable",
        transcript_state: "completed",
        extraction_state: "completed",
        tool_suggestion_state: "skipped",
        indexing_state: "completed",
        background_processing: false,
        transcript_ready: true,
        audio_persisted: true,
        transcript: { text: "Hello" },
        extraction: { payload: {} },
        index: {
            status: "completed",
            builder_version: "v1",
            entries: [],
        },
        ...overrides,
    };
}

const completedJob = makeJob();
const pendingJob = makeJob({
    status: "running",
    extraction_state: "running",
    indexing_state: "pending",
    background_processing: true,
    extraction: undefined,
    index: undefined,
});

describe("lib/capture/capture-background-pipeline", () => {
    beforeEach(() => {
        resetCaptureBackgroundPipelineForTests();
        jest.clearAllMocks();
    });

    afterEach(() => {
        resetCaptureBackgroundPipelineForTests();
    });

    it("runs persist then enrichment in order", async () => {
        const calls: string[] = [];
        const persistCaptureFn = jest.fn(async () => {
            calls.push("persist");
            return { captureId: "capture_1", timelineEventCount: 0 };
        });
        const enrichCaptureFn = jest.fn(async () => {
            calls.push("enrich");
            return {
                captureId: "capture_1",
                timelineEventCount: 1,
                extractedValueCount: 1,
            };
        });
        const getJob = jest
            .fn<(jobId: string) => Promise<JobDetailResponse>>()
            .mockResolvedValueOnce(pendingJob)
            .mockResolvedValue(completedJob);

        enqueueCaptureBackgroundPipeline({
            jobId: "job_bg",
            veritie: { getJob },
            persistCaptureFn,
            enrichCaptureFn,
        });

        await waitFor(() => {
            expect(calls).toEqual(["persist", "enrich"]);
        });
        expect(persistCaptureFn).toHaveBeenCalledWith("job_bg");
        expect(enrichCaptureFn).toHaveBeenCalledWith("job_bg");
        expect(hasPendingJobEnrichment(pendingJob)).toBe(true);
        expect(hasPendingJobEnrichment(completedJob)).toBe(false);
    });

    it("deduplicates in-flight jobs", async () => {
        let resolvePersist: (() => void) | undefined;
        const persistCaptureFn = jest.fn(
            () =>
                new Promise<{ captureId: string; timelineEventCount: number }>(
                    (resolve) => {
                        resolvePersist = () =>
                            resolve({ captureId: "capture_1", timelineEventCount: 0 });
                    },
                ),
        );
        const enrichCaptureFn = jest.fn(async () => ({
            captureId: "capture_1",
            timelineEventCount: 0,
            extractedValueCount: 0,
        }));

        enqueueCaptureBackgroundPipeline({
            jobId: "job_bg",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn,
            enrichCaptureFn,
        });
        enqueueCaptureBackgroundPipeline({
            jobId: "job_bg",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn,
            enrichCaptureFn,
        });

        expect(persistCaptureFn).toHaveBeenCalledTimes(1);
        resolvePersist?.();
        await waitFor(() => {
            expect(enrichCaptureFn).toHaveBeenCalledTimes(1);
        });
    });

    it("skips enrichment when persist fails", async () => {
        const enrichCaptureFn = jest.fn(async () => ({
            captureId: "capture_1",
            timelineEventCount: 0,
            extractedValueCount: 0,
        }));

        enqueueCaptureBackgroundPipeline({
            jobId: "job_bg",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn: jest.fn(async () => {
                throw new Error("persist failed");
            }),
            enrichCaptureFn,
        });

        await waitFor(() => {
            expect(enrichCaptureFn).not.toHaveBeenCalled();
        });
    });
});

async function waitFor(
    assertion: () => void,
    timeoutMs = 3000,
): Promise<void> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        try {
            assertion();
            return;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    }
    assertion();
}
