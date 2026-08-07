import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockRequireUser = jest.fn<() => Promise<unknown>>();
const mockRequireAccountScope = jest.fn<() => Promise<unknown>>();
const mockFindDbCapture = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockPersistCaptureBundle = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockAssertVeritieJobOwnedByAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetJob = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.mock("@/lib/auth/require-user", () => ({
    requireUser: () => mockRequireUser(),
}));

jest.mock("@/lib/db/repositories/context", () => ({
    requireAccountScope: () => mockRequireAccountScope(),
}));

jest.mock("@/lib/db/repositories/captures", () => ({
    findCaptureByVeritieJobId: (...args: unknown[]) => mockFindDbCapture(...args),
    persistCaptureBundle: (...args: unknown[]) => mockPersistCaptureBundle(...args),
    mergeCaptureEnrichment: jest.fn(),
}));

jest.mock("@/lib/db/repositories/veritie-job-leases", () => ({
    assertVeritieJobOwnedByAccount: (...args: unknown[]) =>
        mockAssertVeritieJobOwnedByAccount(...args),
    VeritieJobAccessError: class VeritieJobAccessError extends Error {
        name = "VeritieJobAccessError";
    },
}));

jest.mock("@/lib/data-source/registry", () => ({
    getDataSourceKind: () => "backend",
}));

jest.mock("@/lib/veritie/server-client", () => ({
    getServerVeritieClient: () => ({
        getJob: (...args: unknown[]) => mockGetJob(...args),
    }),
}));

describe("persistCaptureFromVeritieJob", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequireUser.mockResolvedValue({
            id: "user_1",
            accountId: "account_a",
            appConfig: { saveVoiceLogAudio: false },
        });
        mockRequireAccountScope.mockResolvedValue({
            accountId: "account_a",
            userId: "user_1",
        });
        mockFindDbCapture.mockResolvedValue(null);
        mockAssertVeritieJobOwnedByAccount.mockResolvedValue(undefined);
    });

    it("rejects persist when job lease is missing", async () => {
        const { VeritieJobAccessError } = await import(
            "@/lib/db/repositories/veritie-job-leases"
        );
        mockAssertVeritieJobOwnedByAccount.mockRejectedValue(
            new VeritieJobAccessError("Veritie job is not registered for this account"),
        );

        const { persistCaptureFromVeritieJob } = await import(
            "@/lib/capture/persist-capture-from-job"
        );

        await expect(persistCaptureFromVeritieJob("job_unleased")).rejects.toThrow(
            /not registered/i,
        );
        expect(mockGetJob).not.toHaveBeenCalled();
    });

    it("returns duplicate when unique constraint race resolves to existing capture", async () => {
        mockGetJob.mockResolvedValue({
            job_id: "job_1",
            status: "completed",
            transcript: { text: "hello" },
        });
        mockPersistCaptureBundle.mockResolvedValue({
            capture: { id: "capture_existing" },
            duplicate: true,
        });

        const { persistCaptureFromVeritieJob } = await import(
            "@/lib/capture/persist-capture-from-job"
        );

        const result = await persistCaptureFromVeritieJob("job_1");

        expect(result).toEqual({
            captureId: "capture_existing",
            timelineEventCount: 0,
            duplicate: true,
        });
    });
});
