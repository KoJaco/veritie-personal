import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { resetCaptureStubStoreForTests } from "@/lib/stubs/capture-stubs";
import { resetTimelineStubStoreForTests } from "@/lib/stubs/timeline-stubs";

const mockGetJob = jest.fn<() => Promise<unknown>>();

if (!("Request" in globalThis)) {
    class MockRequest {}
    (globalThis as { Request?: unknown }).Request = MockRequest;
}

if (!("Response" in globalThis)) {
    class MockResponse {
        status: number;
        private payload: unknown;

        constructor(body?: string, init?: { status?: number }) {
            this.status = init?.status ?? 200;
            this.payload = body ? JSON.parse(body) : undefined;
        }

        async json() {
            return this.payload;
        }
    }

    (globalThis as { Response?: unknown }).Response = MockResponse;
}

jest.mock("next/server", () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) =>
            new Response(JSON.stringify(body), {
                status: init?.status ?? 200,
                headers: { "content-type": "application/json" },
            }),
    },
}));

jest.mock("@/lib/veritie/server-client", () => ({
    getServerVeritieClient: () => ({
        getJob: mockGetJob,
    }),
    resetServerVeritieClientForTests: jest.fn(),
}));

jest.mock("@/lib/auth/require-user", () => ({
    requireUser: jest.fn(async () => ({
        id: "user_test",
        accountId: "account_test",
        email: "test@example.com",
        role: "owner",
        plan: "free",
        appConfig: {},
    })),
}));

const completedJob = {
    job_id: "job_test_1",
    status: "completed",
    transcript: {
        text: "Hello world",
        language: "en",
        duration_ms: 1000,
        segments: [],
    },
    extraction: {
        payload: {
            tasks: [
                {
                    aspect: "personal",
                    title: "Follow up",
                    confidence: 0.8,
                    fields: {},
                },
            ],
        },
    },
};

function createRequest(
    body: unknown,
    options: {
        authorization?: string;
        contentLength?: string;
    } = {},
) {
    const raw = JSON.stringify(body);
    return {
        headers: {
            get: (name: string) => {
                if (name === "authorization") return options.authorization ?? null;
                if (name === "content-length")
                    return options.contentLength ?? String(raw.length);
                return null;
            },
        },
        text: async () => raw,
        json: async () => JSON.parse(raw),
    } as never;
}

describe("POST /api/captures", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        resetCaptureStubStoreForTests();
        resetTimelineStubStoreForTests();
        mockGetJob.mockReset();
        process.env = {
            ...originalEnv,
            NODE_ENV: "test",
            ALLOW_STUB_CAPTURE_MUTATIONS: "true",
            PLATFORM_SHELL_FE_DATA_SOURCE: "stub",
            VERITIE_API_URL: "http://localhost:3001",
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
        };
        delete process.env.DATABASE_URL;
        mockGetJob.mockResolvedValue(completedJob);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns 401 in production without a persist secret", async () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: "production",
            ALLOW_STUB_CAPTURE_MUTATIONS: "true",
            VERITIE_API_URL: "http://localhost:3001",
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
        };
        delete process.env.CAPTURES_PERSIST_SECRET;
        delete process.env.DATABASE_URL;
        process.env.PLATFORM_SHELL_FE_DATA_SOURCE = "stub";

        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(
            createRequest({ jobId: "job_test_1" }),
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toMatch(/not configured|Unauthorized/i);
    });

    it("allows production requests with the persist secret", async () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: "production",
            CAPTURES_PERSIST_SECRET: "test-secret",
            ALLOW_STUB_CAPTURE_MUTATIONS: "true",
            PLATFORM_SHELL_FE_DATA_SOURCE: "stub",
            VERITIE_API_URL: "http://localhost:3001",
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
        };
        delete process.env.DATABASE_URL;

        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(
            createRequest(
                { jobId: "job_test_1" },
                { authorization: "Bearer test-secret" },
            ),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.captureId).toMatch(/^capture_/);
        expect(mockGetJob).toHaveBeenCalledWith("job_test_1");
    });

    it("rejects forged job payloads in the request body", async () => {
        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(
            createRequest({
                jobId: "job_test_1",
                job: { job_id: "forged", status: "completed" },
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid request body");
    });

    it("rejects client-supplied captureId", async () => {
        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(
            createRequest({
                jobId: "job_test_1",
                captureId: "capture_forged",
            }),
        );

        expect(response.status).toBe(400);
    });

    it("returns 413 for oversized bodies", async () => {
        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(
            createRequest(
                { jobId: "job_test_1" },
                { contentLength: String(512 * 1024) },
            ),
        );

        expect(response.status).toBe(413);
    });

    it("persists a capture from a server-fetched job", async () => {
        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(createRequest({ jobId: "job_test_1" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.captureId).toMatch(/^capture_/);
        expect(body.timelineEventCount).toBe(1);
        expect(mockGetJob).toHaveBeenCalledWith("job_test_1");
    });

    it("returns the existing capture for duplicate job ids", async () => {
        const { POST } = await import("@/app/api/captures/route");
        const first = await POST(createRequest({ jobId: "job_seed_morning" }));
        const firstBody = await first.json();

        expect(first.status).toBe(200);
        expect(firstBody.duplicate).toBe(true);
        expect(firstBody.captureId).toBe("capture_seed_morning_log");
        expect(mockGetJob).not.toHaveBeenCalled();
    });

    it("returns 503 when stub mutations are disabled", async () => {
        process.env.ALLOW_STUB_CAPTURE_MUTATIONS = "false";

        const { POST } = await import("@/app/api/captures/route");
        const response = await POST(createRequest({ jobId: "job_test_1" }));
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.error).toMatch(/not available/i);
    });
});
