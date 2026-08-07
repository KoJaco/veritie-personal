import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockAfter = jest.fn<(callback: () => void | Promise<void>) => void>();
const mockRequireSessionApiAccess = jest.fn<() => Promise<Response | null>>();
const mockCompleteCaptureFromVeritieJob =
    jest.fn<(jobId: string) => Promise<unknown>>();

function mockCreateJsonResponse(body: unknown, status = 200): Response {
    return {
        status,
        json: async () => body,
    } as Response;
}

jest.mock("next/server", () => ({
    after: (callback: () => void | Promise<void>) => mockAfter(callback),
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) =>
            mockCreateJsonResponse(body, init?.status ?? 200),
    },
}));

jest.mock("@/lib/api/require-session-api-access", () => ({
    requireSessionApiAccess: () => mockRequireSessionApiAccess(),
}));

jest.mock("@/lib/capture/complete-capture-from-job.server", () => ({
    completeCaptureFromVeritieJob: (jobId: string) =>
        mockCompleteCaptureFromVeritieJob(jobId),
}));

async function loadPost() {
    const mod = await import("@/app/api/captures/jobs/[jobId]/complete/route");
    return mod.POST;
}

describe("POST /api/captures/jobs/[jobId]/complete", () => {
    beforeEach(() => {
        jest.resetModules();
        mockAfter.mockReset();
        mockRequireSessionApiAccess.mockReset();
        mockCompleteCaptureFromVeritieJob.mockReset();
        mockRequireSessionApiAccess.mockResolvedValue(null);
        mockCompleteCaptureFromVeritieJob.mockResolvedValue({
            persisted: { captureId: "capture_1", timelineEventCount: 0 },
            enriched: {
                captureId: "capture_1",
                timelineEventCount: 1,
                extractedValueCount: 1,
            },
        });
    });

    it("schedules server-side completion after returning accepted", async () => {
        const POST = await loadPost();
        const response = await POST({} as never, {
            params: Promise.resolve({ jobId: "job_voice" }),
        });

        await expect(response.json()).resolves.toEqual({ ok: true });
        expect(response.status).toBe(202);
        expect(mockAfter).toHaveBeenCalledTimes(1);
        expect(mockCompleteCaptureFromVeritieJob).not.toHaveBeenCalled();

        const callback = mockAfter.mock.calls[0][0] as () => Promise<void>;
        await callback();

        expect(mockCompleteCaptureFromVeritieJob).toHaveBeenCalledWith("job_voice");
    });

    it("returns auth denial without scheduling work", async () => {
        const POST = await loadPost();
        mockRequireSessionApiAccess.mockResolvedValueOnce(
            mockCreateJsonResponse({ error: "Unauthorized" }, 401),
        );

        const response = await POST({} as never, {
            params: Promise.resolve({ jobId: "job_voice" }),
        });

        expect(response.status).toBe(401);
        expect(mockAfter).not.toHaveBeenCalled();
    });

    it("rejects invalid job ids", async () => {
        const POST = await loadPost();
        const response = await POST({} as never, {
            params: Promise.resolve({ jobId: "" }),
        });

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: "Invalid job id" });
        expect(mockAfter).not.toHaveBeenCalled();
    });
});
