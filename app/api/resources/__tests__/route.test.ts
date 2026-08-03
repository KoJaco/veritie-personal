import { describe, expect, it, jest } from "@jest/globals";

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

describe("POST /api/resources", () => {
    it("creates a resource and returns the backing identifier", async () => {
        const { POST } = await import("@/app/api/resources/route");
        const request = {
            json: async () => ({
                name: "Identity Platform",
                category: "service",
                ownerName: "Jordan Smith",
                criticality: "high",
                sensitivity: "internal",
            }),
        } as never;

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body).toEqual({
            resourceId: expect.any(String),
        });
    });

    it("returns 400 for missing resource names", async () => {
        const { POST } = await import("@/app/api/resources/route");
        const request = {
            json: async () => ({
                name: "",
                ownerName: "Jordan Smith",
            }),
        } as never;

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({
            error: "Resource name is required.",
        });
    });
});
