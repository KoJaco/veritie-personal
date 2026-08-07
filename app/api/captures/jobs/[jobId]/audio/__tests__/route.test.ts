import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("next/server", () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) =>
            new Response(JSON.stringify(body), {
                status: init?.status ?? 200,
                headers: { "content-type": "application/json" },
            }),
    },
}));

const mockRequireSessionApiAccess = jest.fn<() => Promise<Response | null>>();
const mockRequireUser = jest.fn<() => Promise<unknown>>();
const mockRequireAccountScope = jest.fn<() => Promise<unknown>>();
const mockAssertVeritieJobOwnedByAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockUpload = jest.fn<() => Promise<unknown>>();

jest.mock("@/lib/api/require-session-api-access", () => ({
    requireSessionApiAccess: () => mockRequireSessionApiAccess(),
}));

jest.mock("@/lib/auth/require-user", () => ({
    requireUser: () => mockRequireUser(),
}));

jest.mock("@/lib/db/repositories/context", () => ({
    requireAccountScope: () => mockRequireAccountScope(),
}));

jest.mock("@/lib/db/repositories/veritie-job-leases", () => ({
    assertVeritieJobOwnedByAccount: (...args: unknown[]) =>
        mockAssertVeritieJobOwnedByAccount(...args),
}));

jest.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        storage: {
            from: () => ({
                upload: mockUpload,
            }),
        },
    }),
}));

jest.mock("@/lib/config/env.server", () => ({
    envServer: {
        supabaseAudioBucket: "audio",
    },
}));

describe("app/api/captures/jobs/[jobId]/audio/route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequireAccountScope.mockResolvedValue({
            accountId: "account_test",
            userId: "user_test",
        });
        mockAssertVeritieJobOwnedByAccount.mockResolvedValue(undefined);
        mockUpload.mockResolvedValue({ error: null });
        mockRequireSessionApiAccess.mockResolvedValue(null);
    });

    it("POST rejects when saveVoiceLogAudio is disabled", async () => {
        mockRequireUser.mockResolvedValue({
            id: "user_test",
            accountId: "account_test",
            appConfig: { saveVoiceLogAudio: false },
        });

        const { POST } = await import("../route");
        const formData = new FormData();
        formData.append("audio", new Blob(["x"], { type: "audio/webm" }));
        const response = await POST(
            new Request("http://localhost/api/captures/jobs/job_1/audio", {
                method: "POST",
                body: formData,
            }) as import("next/server").NextRequest,
            { params: Promise.resolve({ jobId: "job_1" }) },
        );

        expect(response.status).toBe(403);
    });

    it("POST returns 404 when job lease is not owned", async () => {
        mockRequireUser.mockResolvedValue({
            id: "user_test",
            accountId: "account_test",
            appConfig: { saveVoiceLogAudio: true },
        });
        mockAssertVeritieJobOwnedByAccount.mockRejectedValue(new Error("not found"));

        const { POST } = await import("../route");
        const formData = new FormData();
        formData.append("audio", new Blob(["x"], { type: "audio/webm" }));
        const response = await POST(
            new Request("http://localhost/api/captures/jobs/job_1/audio", {
                method: "POST",
                body: formData,
            }) as import("next/server").NextRequest,
            { params: Promise.resolve({ jobId: "job_1" }) },
        );

        expect(response.status).toBe(404);
    });

    it("POST uploads to job-scoped staging path", async () => {
        mockRequireUser.mockResolvedValue({
            id: "user_test",
            accountId: "account_test",
            appConfig: { saveVoiceLogAudio: true },
        });

        const { POST } = await import("../route");
        const formData = new FormData();
        formData.append("audio", new Blob(["x"], { type: "audio/webm" }));
        const request = {
            formData: async () => formData,
        } as import("next/server").NextRequest;
        const response = await POST(
            request,
            { params: Promise.resolve({ jobId: "job_1" }) },
        );

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload.path).toBe(
            "account_test/user_test/jobs/job_1/audio.webm",
        );
        expect(mockUpload).toHaveBeenCalled();
    });
});
