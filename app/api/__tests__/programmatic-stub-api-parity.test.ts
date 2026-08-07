import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { resetCaptureStubStoreForTests } from "@/lib/stubs/capture-stubs";
import { resetTimelineStubStoreForTests } from "@/lib/stubs/timeline-stubs";
import { createTestJsonRequest } from "@/lib/api/test-json-request";

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

function createJsonRequest(
    body: unknown,
    options: { authorization?: string } = {},
) {
    return createTestJsonRequest(body, {
        authorization: options.authorization,
    });
}

function createGetRequest(options: { authorization?: string } = {}) {
    return {
        headers: {
            get: (name: string) => {
                if (name === "authorization") return options.authorization ?? null;
                return null;
            },
        },
    } as never;
}

describe("POST /api/extracted-values/review", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        resetCaptureStubStoreForTests();
        resetTimelineStubStoreForTests();
        process.env = {
            ...originalEnv,
            NODE_ENV: "test",
            PLATFORM_SHELL_FE_DATA_SOURCE: "stub",
        };
        delete process.env.DATABASE_URL;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("updates review state in stub mode", async () => {
        const { POST } = await import("@/app/api/extracted-values/review/route");
        const response = await POST(
            createJsonRequest({
                extractedValueId: "extracted_task_medibank",
                reviewState: "confirmed",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ ok: true });
    });

    it("returns 400 for invalid payloads", async () => {
        const { POST } = await import("@/app/api/extracted-values/review/route");
        const response = await POST(
            createJsonRequest({
                extractedValueId: "extracted_task_medibank",
                reviewState: "edited",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid payload");
    });

    it("returns 401 in production without a persist secret", async () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: "production",
            PLATFORM_SHELL_FE_DATA_SOURCE: "stub",
        };
        delete process.env.CAPTURES_PERSIST_SECRET;
        delete process.env.DATABASE_URL;

        const { POST } = await import("@/app/api/extracted-values/review/route");
        const response = await POST(
            createJsonRequest({
                extractedValueId: "extracted_task_medibank",
                reviewState: "confirmed",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toMatch(/not configured|Unauthorized/i);
    });
});

describe("GET /api/timeline/events/[eventId]", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        resetCaptureStubStoreForTests();
        resetTimelineStubStoreForTests();
        process.env = {
            ...originalEnv,
            NODE_ENV: "test",
            PLATFORM_SHELL_FE_DATA_SOURCE: "stub",
        };
        delete process.env.DATABASE_URL;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns timeline and capture detail in stub mode", async () => {
        const { GET } = await import(
            "@/app/api/timeline/events/[eventId]/route"
        );
        const response = await GET(createGetRequest(), {
            params: Promise.resolve({ eventId: "timeline_task_medibank" }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.detail.event.id).toBe("timeline_task_medibank");
        expect(body.captureDetail?.capture.id).toBe("capture_seed_morning_log");
    });

    it("returns 404 for unknown events", async () => {
        const { GET } = await import(
            "@/app/api/timeline/events/[eventId]/route"
        );
        const response = await GET(createGetRequest(), {
            params: Promise.resolve({ eventId: "timeline_missing" }),
        });
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error).toBe("Event not found");
    });

    it("returns 400 for invalid event ids", async () => {
        const { GET } = await import(
            "@/app/api/timeline/events/[eventId]/route"
        );
        const response = await GET(createGetRequest(), {
            params: Promise.resolve({ eventId: "" }),
        });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid event id");
    });
});
