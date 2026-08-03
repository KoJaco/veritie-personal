import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockProxyVeritieRequest = jest.fn<
    (input: unknown, config: unknown) => Promise<Response>
>();

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
    NextRequest: class MockNextRequest {},
    NextResponse: class MockNextResponse {
        status: number;
        body: unknown;

        constructor(body?: unknown, init?: { status?: number }) {
            this.body = body;
            this.status = init?.status ?? 200;
        }

        static json(body: unknown, init?: { status?: number }) {
            return new Response(JSON.stringify(body), {
                status: init?.status ?? 200,
                headers: { "content-type": "application/json" },
            });
        }

        async json() {
            if (this.body instanceof ReadableStream) {
                const reader = this.body.getReader();
                const chunks: Uint8Array[] = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) chunks.push(value);
                }
                const merged = new Uint8Array(
                    chunks.reduce((sum, chunk) => sum + chunk.length, 0),
                );
                let offset = 0;
                for (const chunk of chunks) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }
                return JSON.parse(new TextDecoder().decode(merged));
            }

            if (typeof this.body === "string") {
                return JSON.parse(this.body);
            }

            return this.body;
        }
    },
}));

jest.mock("@/lib/veritie/proxy-request", () => {
    const actual = jest.requireActual<typeof import("@/lib/veritie/proxy-request")>(
        "@/lib/veritie/proxy-request",
    );
    return {
        ...actual,
        getVeritieProxyConfig: () => ({
            baseUrl: "http://veritie.test",
            pipelineAlias: "veritie-personal",
            apiKey: "server-secret",
        }),
        extractForwardableClientHeaders: () => ({ "Idempotency-Key": "create-1" }),
        proxyVeritieRequest: (input: unknown, config: unknown) =>
            mockProxyVeritieRequest(input, config),
    };
});

function createNextRequest(
    options: {
        method?: string;
        search?: string;
        body?: string;
        contentType?: string;
    } = {},
) {
    return {
        method: options.method ?? "GET",
        nextUrl: {
            search: options.search ?? "",
        },
        headers: {
            get: (name: string) => {
                if (name === "content-type") {
                    return options.contentType ?? null;
                }
                return null;
            },
            forEach: () => {},
        },
        text: async () => options.body ?? "",
        signal: undefined,
    } as never;
}

describe("app/api/veritie/v1/[...path]/route", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        mockProxyVeritieRequest.mockReset();
        process.env = {
            ...originalEnv,
            VERITIE_API_URL: "http://veritie.test",
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
            VERITIE_API_KEY: "server-secret",
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("proxies GET job requests", async () => {
        mockProxyVeritieRequest.mockResolvedValue(
            new Response(JSON.stringify({ job_id: "job_1" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
        );

        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: ["jobs", "job_1"] }),
        });

        expect(mockProxyVeritieRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "GET",
                pathSegments: ["jobs", "job_1"],
            }),
            expect.any(Object),
        );
        expect(response.status).toBe(200);
    });

    it("proxies POST job creation", async () => {
        mockProxyVeritieRequest.mockResolvedValue(
            new Response(JSON.stringify({ job_id: "job_new" }), {
                status: 201,
                headers: { "content-type": "application/json" },
            }),
        );

        const { POST } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await POST(
            createNextRequest({
                method: "POST",
                body: JSON.stringify({ audio_content_type: "audio/webm" }),
                contentType: "application/json",
            }),
            {
                params: Promise.resolve({ path: ["jobs"] }),
            },
        );

        expect(mockProxyVeritieRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                pathSegments: ["jobs"],
                body: JSON.stringify({ audio_content_type: "audio/webm" }),
            }),
            expect.any(Object),
        );
        expect(response.status).toBe(201);
    });

    it("rejects PUT with method not allowed", async () => {
        const { PUT } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await PUT();
        const body = await response.json();

        expect(response.status).toBe(405);
        expect(body.error).toMatch(/Signed upload URLs/i);
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
    });

    it("returns 400 when path segments are missing", async () => {
        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: [] }),
        });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toMatch(/Missing Veritie path/i);
    });

    it("returns 403 for disallowed proxy paths", async () => {
        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: ["admin", "secrets"] }),
        });
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toMatch(/not allowed/i);
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
    });
});
