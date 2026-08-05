import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetJob = jest.fn<(jobId: string) => Promise<unknown>>();
const mockAppendCaptureFromJob = jest.fn();
const mockFindCaptureByVeritieJobId = jest.fn();
const mockMergeCaptureEnrichment = jest.fn();

jest.mock("@/lib/data-source/registry", () => ({
    getDataSourceKind: () => "stub",
}));

jest.mock("@/lib/veritie/server-client", () => ({
    getServerVeritieClient: () => ({
        getJob: (jobId: string) => mockGetJob(jobId),
    }),
}));

jest.mock("@/lib/data-source/captures-read-model", () => ({
    appendCaptureFromJob: (...args: unknown[]) => mockAppendCaptureFromJob(...args),
    findCaptureByVeritieJobId: (...args: unknown[]) =>
        mockFindCaptureByVeritieJobId(...args),
    mergeCaptureEnrichment: (...args: unknown[]) =>
        mockMergeCaptureEnrichment(...args),
}));

describe("lib/capture/persist-capture-from-job enrich", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            ALLOW_STUB_CAPTURE_MUTATIONS: "true",
            VERITIE_API_URL: "http://veritie.test",
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("merges enrichment into an existing capture", async () => {
        mockFindCaptureByVeritieJobId.mockReturnValue({
            id: "capture_existing",
            veritieJobId: "job_enrich",
            status: "processing",
        });
        mockGetJob.mockResolvedValue({
            job_id: "job_enrich",
            status: "completed",
            transcript: { text: "Hello" },
            extraction: {
                payload: {
                    tasks: [{ aspect: "personal", title: "Follow up" }],
                },
            },
        });

        const { enrichCaptureFromVeritieJob } = await import(
            "@/lib/capture/persist-capture-from-job"
        );

        const result = await enrichCaptureFromVeritieJob("job_enrich");

        expect(result.captureId).toBe("capture_existing");
        expect(mockMergeCaptureEnrichment).toHaveBeenCalledWith(
            expect.objectContaining({
                captureId: "capture_existing",
                status: "completed",
            }),
        );
        expect(
            (mockMergeCaptureEnrichment.mock.calls[0]?.[0] as {
                extractedValues: unknown[];
            }).extractedValues.length,
        ).toBeGreaterThan(0);
    });

    it("throws when capture does not exist", async () => {
        mockFindCaptureByVeritieJobId.mockReturnValue(undefined);

        const { enrichCaptureFromVeritieJob } = await import(
            "@/lib/capture/persist-capture-from-job"
        );

        await expect(enrichCaptureFromVeritieJob("job_missing")).rejects.toThrow(
            /not found/i,
        );
    });
});
