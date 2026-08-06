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
const mockAssertCaptureInAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockUpdateVoiceLogAudioUri = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockCreateSignedUrl = jest.fn<() => Promise<unknown>>();
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

jest.mock("@/lib/db/repositories/captures", () => ({
    assertCaptureInAccount: (...args: unknown[]) =>
        mockAssertCaptureInAccount(...args),
    updateVoiceLogAudioUri: (...args: unknown[]) =>
        mockUpdateVoiceLogAudioUri(...args),
}));

jest.mock("@/lib/db", () => ({
    getDb: () => ({
        query: {
            voiceLogs: {
                findFirst: jest.fn(async () => ({
                    audioUri: "account/user/capture.webm",
                })),
            },
        },
    }),
}));

jest.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        storage: {
            from: () => ({
                createSignedUrl: mockCreateSignedUrl,
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

describe("app/api/captures/[captureId]/audio/route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequireAccountScope.mockResolvedValue({
            accountId: "account_test",
            userId: "user_test",
        });
        mockAssertCaptureInAccount.mockResolvedValue(undefined);
        mockCreateSignedUrl.mockResolvedValue({
            data: { signedUrl: "https://signed.example/audio" },
            error: null,
        });
        mockUpload.mockResolvedValue({ error: null });
        mockUpdateVoiceLogAudioUri.mockResolvedValue({ id: "voice_log_1" });
        mockRequireSessionApiAccess.mockResolvedValue(null);
    });

    it("GET returns 401 when session is missing", async () => {
        mockRequireSessionApiAccess.mockResolvedValue(
            new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            }),
        );

        const { GET } = await import("../route");
        const response = await GET(
            new Request("http://localhost/api/captures/cap_1/audio") as import("next/server").NextRequest,
            { params: Promise.resolve({ captureId: "cap_1" }) },
        );

        expect(response.status).toBe(401);
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
            new Request("http://localhost/api/captures/cap_1/audio", {
                method: "POST",
                body: formData,
            }) as import("next/server").NextRequest,
            { params: Promise.resolve({ captureId: "cap_1" }) },
        );

        expect(response.status).toBe(403);
        const payload = await response.json();
        expect(payload.error).toContain("disabled");
    });

    it("GET returns signed playback URL for authorized capture", async () => {
        mockRequireUser.mockResolvedValue({
            id: "user_test",
            accountId: "account_test",
            appConfig: { saveVoiceLogAudio: true },
        });

        const { GET } = await import("../route");
        const response = await GET(
            new Request("http://localhost/api/captures/cap_1/audio") as import("next/server").NextRequest,
            { params: Promise.resolve({ captureId: "cap_1" }) },
        );

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload.url).toBe("https://signed.example/audio");
    });
});
