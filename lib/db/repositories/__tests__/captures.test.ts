import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockInsert = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/db", () => ({
    getDb: () => ({
        query: {
            captures: {
                findFirst: mockFindFirst,
                findMany: mockFindMany,
            },
        },
        insert: mockInsert,
        transaction: mockTransaction,
    }),
}));

describe("captures repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction.mockImplementation(async (callback: unknown) => {
            const run = callback as (tx: {
                insert: typeof mockInsert;
                query: {
                    extractedValues: { findMany: jest.Mock };
                    timelineEvents: { findMany: jest.Mock };
                };
            }) => Promise<void>;
            return run({
                insert: mockInsert,
                query: {
                    extractedValues: { findMany: jest.fn(async () => []) },
                    timelineEvents: { findMany: jest.fn(async () => []) },
                },
            });
        });
        mockInsert.mockReturnValue({ values: jest.fn(async () => undefined) });
    });

    it("scopes findCaptureByVeritieJobId by accountId", async () => {
        mockFindFirst.mockResolvedValue({
            id: "capture_1",
            accountId: "account_a",
            type: "voice",
            status: "completed",
            title: "Test",
            aspectIds: ["personal"],
            veritieJobId: "job_1",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as never);

        const { findCaptureByVeritieJobId } = await import(
            "@/lib/db/repositories/captures"
        );

        const result = await findCaptureByVeritieJobId(
            { accountId: "account_a", userId: "user_1" },
            "job_1",
        );

        expect(result?.id).toBe("capture_1");
        expect(mockFindFirst).toHaveBeenCalled();
    });

    it("inserts usage_events on persistCaptureBundle", async () => {
        const { persistCaptureBundle } = await import(
            "@/lib/db/repositories/captures"
        );

        await persistCaptureBundle(
            { accountId: "account_a", userId: "user_1" },
            {
                capture: {
                    id: "capture_new",
                    type: "voice",
                    status: "processing",
                    title: "Voice log",
                    aspectIds: ["personal"],
                    veritieJobId: "job_new",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                voiceLog: {
                    id: "voice_1",
                    captureId: "capture_new",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                segments: [],
                extractedValues: [],
                timelineEvents: [],
            },
        );

        expect(mockTransaction).toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
    });
});
