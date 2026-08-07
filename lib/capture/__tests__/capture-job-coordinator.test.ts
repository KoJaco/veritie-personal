import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { JobDetailResponse } from "@veritie/sdk";
import { hasPendingJobEnrichment } from "@veritie/sdk";

import {
    captureJobCoordinator,
    MAX_ENRICHMENT_POLLS,
} from "@/lib/capture/capture-job-coordinator";
import { resetCaptureBackgroundPipelineForTests } from "@/lib/capture/capture-background-pipeline";

jest.mock("sonner", () => ({
    toast: {
        error: jest.fn(),
    },
}));

function makeJob(
    overrides: Partial<JobDetailResponse> = {},
): JobDetailResponse {
    return {
        job_id: "job_coord",
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
        extraction: { payload: { title: "Test" } },
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

describe("lib/capture/capture-job-coordinator", () => {
    beforeEach(() => {
        resetCaptureBackgroundPipelineForTests();
        jest.clearAllMocks();
    });

    afterEach(() => {
        resetCaptureBackgroundPipelineForTests();
    });

    it("runs persist then enrich in parallel with staged audio", async () => {
        const calls: string[] = [];
        let resolveStaging: (() => void) | undefined;
        const audioStagingPromise = new Promise<void>((resolve) => {
            resolveStaging = () => {
                calls.push("staging");
                resolve();
            };
        });
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
            .mockResolvedValue(completedJob);

        captureJobCoordinator.start({
            jobId: "job_coord",
            veritie: { getJob },
            persistCaptureFn,
            enrichCaptureFn,
            audioStagedForJob: true,
            audioStagingPromise,
        });

        await waitFor(() => {
            expect(calls).toContain("persist");
            expect(calls).toContain("enrich");
        });

        expect(calls).not.toContain("staging");
        resolveStaging?.();

        await waitFor(() => {
            expect(calls).toEqual(["persist", "enrich", "staging"]);
        });
    });

    it("runs persist, optional capture audio upload, then enrich in parallel", async () => {
        const calls: string[] = [];
        const uploadAudioFn = jest.fn(async () => {
            calls.push("upload");
        });
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

        captureJobCoordinator.start({
            jobId: "job_coord",
            veritie: { getJob },
            persistCaptureFn,
            enrichCaptureFn,
            uploadAudioFn,
            audioBlob: new Blob(["audio"], { type: "audio/webm" }),
        });

        await waitFor(() => {
            expect(calls).toContain("persist");
            expect(calls).toContain("upload");
            expect(calls).toContain("enrich");
        });
    });

    it("emits capture:audio-uploaded for staged audio", async () => {
        const events: string[] = [];
        captureJobCoordinator.subscribe((event) => {
            events.push(event.type);
        });

        captureJobCoordinator.start({
            jobId: "job_coord",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn: jest.fn(async () => ({
                captureId: "capture_1",
                timelineEventCount: 0,
            })),
            enrichCaptureFn: jest.fn(async () => ({
                captureId: "capture_1",
                timelineEventCount: 0,
                extractedValueCount: 0,
            })),
            audioStagedForJob: true,
            audioStagingPromise: Promise.resolve(),
        });

        await waitFor(() => {
            expect(events).toContain("capture:audio-uploaded");
        });
    });

    it("emits events to subscribers and survives unsubscribe", async () => {
        const events: string[] = [];
        const unsubscribe = captureJobCoordinator.subscribe((event) => {
            events.push(event.type);
        });

        captureJobCoordinator.start({
            jobId: "job_coord",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn: jest.fn(async () => ({
                captureId: "capture_1",
                timelineEventCount: 0,
            })),
            enrichCaptureFn: jest.fn(async () => ({
                captureId: "capture_1",
                timelineEventCount: 0,
                extractedValueCount: 0,
            })),
        });

        await waitFor(() => {
            expect(events).toContain("capture:persisted");
            expect(events).toContain("capture:enriched");
        });

        unsubscribe();

        captureJobCoordinator.start({
            jobId: "job_coord_2",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn: jest.fn(async () => ({
                captureId: "capture_2",
                timelineEventCount: 0,
            })),
            enrichCaptureFn: jest.fn(async () => ({
                captureId: "capture_2",
                timelineEventCount: 0,
                extractedValueCount: 0,
            })),
        });

        await waitFor(() => {
            expect(events.filter((type) => type === "capture:persisted").length).toBe(1);
        });
    });

    it("tracks in-flight jobs", async () => {
        let resolvePersist: (() => void) | undefined;
        const persistCaptureFn = jest.fn(
            () =>
                new Promise<{ captureId: string; timelineEventCount: number }>(
                    (resolve) => {
                        resolvePersist = () =>
                            resolve({
                                captureId: "capture_1",
                                timelineEventCount: 0,
                            });
                    },
                ),
        );

        captureJobCoordinator.start({
            jobId: "job_coord",
            veritie: { getJob: jest.fn(async () => completedJob) },
            persistCaptureFn,
            enrichCaptureFn: jest.fn(async () => ({
                captureId: "capture_1",
                timelineEventCount: 0,
                extractedValueCount: 0,
            })),
        });

        expect(captureJobCoordinator.isJobInFlight("job_coord")).toBe(true);
        resolvePersist?.();
        await waitFor(() => {
            expect(captureJobCoordinator.isJobInFlight("job_coord")).toBe(false);
        });
    });

    it("polls enrichment up to MAX_ENRICHMENT_POLLS", () => {
        expect(MAX_ENRICHMENT_POLLS).toBe(120);
        expect(hasPendingJobEnrichment(pendingJob)).toBe(true);
        expect(hasPendingJobEnrichment(completedJob)).toBe(false);
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
