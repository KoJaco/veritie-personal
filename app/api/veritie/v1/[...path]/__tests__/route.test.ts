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

        async text() {
            return typeof this.payload === "string"
                ? this.payload
                : JSON.stringify(this.payload);
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
            if (typeof this.body === "string") {
                return JSON.parse(this.body);
            }

            return this.body;
        }
    },
}));

jest.mock("@/lib/auth/require-user", () => ({
    requireUser: jest.fn(async () => ({
        id: "user_1",
        accountId: "account_a",
    })),
}));

jest.mock("@/lib/db/repositories/context", () => ({
    requireAccountScope: jest.fn(async () => ({
        accountId: "account_a",
        userId: "user_1",
    })),
}));

jest.mock("@/lib/db/repositories/veritie-job-leases", () => ({
    assertVeritieJobOwnedByAccount: jest.fn(async () => undefined),
    VeritieJobAccessError: class VeritieJobAccessError extends Error {
        name = "VeritieJobAccessError";
    },
    isVeritieJobAccessError: (error: unknown) =>
        error instanceof Error && error.name === "VeritieJobAccessError",
}));

jest.mock("@/lib/veritie/register-job-lease", () => {
    const actual = jest.requireActual<typeof import("@/lib/veritie/register-job-lease")>(
        "@/lib/veritie/register-job-lease",
    );
    return {
        ...actual,
        registerVeritieJobLeaseFromProxyResponse: jest.fn(async () => undefined),
    };
});

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
    const bodyText = options.body ?? "";
    const bodyBytes = Buffer.byteLength(bodyText, "utf8");

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
                if (name === "content-length") {
                    return bodyBytes > 0 ? String(bodyBytes) : null;
                }
                return null;
            },
            forEach: () => {},
        },
        body:
            bodyBytes > 0
                ? new ReadableStream({
                      start(controller) {
                          controller.enqueue(new TextEncoder().encode(bodyText));
                          controller.close();
                      },
                  })
                : null,
        text: async () => bodyText,
        signal: undefined,
    } as never;
}

type AnyMock = jest.MockedFunction<(...args: never[]) => Promise<unknown>>;

function getMockFn(modulePath: string, exportName: string): AnyMock {
    const mockedModule = jest.requireMock(modulePath) as Record<string, AnyMock>;
    return mockedModule[exportName];
}

function createUpstreamResponse(body: unknown, status = 200) {
    const payload = JSON.stringify(body);
    return {
        status,
        statusText: status === 201 ? "Created" : "OK",
        headers: {
            get: (name: string) =>
                name === "content-type" ? "application/json" : null,
        },
        text: async () => payload,
    } as Response;
}

describe("app/api/veritie/v1/[...path]/route", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        mockProxyVeritieRequest.mockReset();
        getMockFn("@/lib/auth/require-user", "requireUser").mockResolvedValue({
            id: "user_1",
            accountId: "account_a",
        });
        getMockFn("@/lib/db/repositories/context", "requireAccountScope").mockResolvedValue({
            accountId: "account_a",
            userId: "user_1",
        });
        getMockFn(
            "@/lib/db/repositories/veritie-job-leases",
            "assertVeritieJobOwnedByAccount",
        ).mockResolvedValue(undefined);
        getMockFn(
            "@/lib/veritie/register-job-lease",
            "registerVeritieJobLeaseFromProxyResponse",
        ).mockResolvedValue(undefined);
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

    it("returns 401 when session is missing", async () => {
        const { UnauthorizedError } = await import("@/lib/auth/errors");
        getMockFn("@/lib/auth/require-user", "requireUser").mockRejectedValue(
            new UnauthorizedError(),
        );

        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: ["jobs", "job_1"] }),
        });
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
    });

    it("proxies GET job requests", async () => {
        mockProxyVeritieRequest.mockResolvedValue(
            createUpstreamResponse({ job_id: "job_1" }),
        );

        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: ["jobs", "job_1"] }),
        });

        expect(
            getMockFn(
                "@/lib/db/repositories/veritie-job-leases",
                "assertVeritieJobOwnedByAccount",
            ),
        ).toHaveBeenCalledWith(
            { accountId: "account_a", userId: "user_1" },
            "job_1",
        );
        expect(mockProxyVeritieRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "GET",
                pathSegments: ["jobs", "job_1"],
            }),
            expect.any(Object),
        );
        expect(response.status).toBe(200);
    });

    it("returns 403 when GET job belongs to another account", async () => {
        const { VeritieJobAccessError } = jest.requireMock<{
            VeritieJobAccessError: new (message: string) => Error;
        }>("@/lib/db/repositories/veritie-job-leases");
        getMockFn(
            "@/lib/db/repositories/veritie-job-leases",
            "assertVeritieJobOwnedByAccount",
        ).mockRejectedValue(
            new VeritieJobAccessError("Veritie job belongs to another account"),
        );

        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: ["jobs", "job_other"] }),
        });
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toMatch(/another account/i);
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
    });

    it("proxies POST job creation with tenant metadata", async () => {
        mockProxyVeritieRequest.mockResolvedValue(
            createUpstreamResponse({ job_id: "job_new" }, 201),
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
                body: JSON.stringify({
                    audio_content_type: "audio/webm",
                    metadata: {
                        account_id: "account_a",
                        user_id: "user_1",
                    },
                }),
            }),
            expect.any(Object),
        );
        expect(
            getMockFn(
                "@/lib/veritie/register-job-lease",
                "registerVeritieJobLeaseFromProxyResponse",
            ),
        ).toHaveBeenCalled();
        expect(response.status).toBe(201);
    });

    it("returns 413 when POST body exceeds proxy limit", async () => {
        const { VERITIE_PROXY_MAX_BODY_BYTES } = await import(
            "@/lib/veritie/proxy-request"
        );
        const oversizedBody = "x".repeat(VERITIE_PROXY_MAX_BODY_BYTES + 1);

        const { POST } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await POST(
            createNextRequest({
                method: "POST",
                body: oversizedBody,
                contentType: "application/json",
            }),
            {
                params: Promise.resolve({ path: ["jobs"] }),
            },
        );
        const body = await response.json();

        expect(response.status).toBe(413);
        expect(body.error).toMatch(/too large/i);
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
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

    it("returns 403 when GET job has no lease", async () => {
        const { VeritieJobAccessError } = jest.requireMock<{
            VeritieJobAccessError: new (message: string) => Error;
        }>("@/lib/db/repositories/veritie-job-leases");
        getMockFn(
            "@/lib/db/repositories/veritie-job-leases",
            "assertVeritieJobOwnedByAccount",
        ).mockRejectedValue(
            new VeritieJobAccessError(
                "Veritie job is not registered for this account",
            ),
        );

        const { GET } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await GET(createNextRequest(), {
            params: Promise.resolve({ path: ["jobs", "job_unleased"] }),
        });
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toMatch(/not registered/i);
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
    });

    it("returns 403 when POST upload-finalize has no lease", async () => {
        const { VeritieJobAccessError } = jest.requireMock<{
            VeritieJobAccessError: new (message: string) => Error;
        }>("@/lib/db/repositories/veritie-job-leases");
        getMockFn(
            "@/lib/db/repositories/veritie-job-leases",
            "assertVeritieJobOwnedByAccount",
        ).mockRejectedValue(
            new VeritieJobAccessError(
                "Veritie job is not registered for this account",
            ),
        );

        const { POST } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await POST(
            createNextRequest({
                method: "POST",
                body: JSON.stringify({}),
                contentType: "application/json",
            }),
            {
                params: Promise.resolve({
                    path: ["jobs", "job_unleased", "upload-finalize"],
                }),
            },
        );
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toMatch(/not registered/i);
        expect(mockProxyVeritieRequest).not.toHaveBeenCalled();
    });

    it("proxies POST upload-finalize when job is leased", async () => {
        mockProxyVeritieRequest.mockResolvedValue(
            createUpstreamResponse({ status: "finalized" }),
        );

        const { POST } = await import("@/app/api/veritie/v1/[...path]/route");
        const response = await POST(
            createNextRequest({
                method: "POST",
                body: JSON.stringify({}),
                contentType: "application/json",
            }),
            {
                params: Promise.resolve({
                    path: ["jobs", "job_1", "upload-finalize"],
                }),
            },
        );

        expect(
            getMockFn(
                "@/lib/db/repositories/veritie-job-leases",
                "assertVeritieJobOwnedByAccount",
            ),
        ).toHaveBeenCalledWith(
            { accountId: "account_a", userId: "user_1" },
            "job_1",
        );
        expect(mockProxyVeritieRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                pathSegments: ["jobs", "job_1", "upload-finalize"],
            }),
            expect.any(Object),
        );
        expect(response.status).toBe(200);
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
