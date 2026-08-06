import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
    buildVeritieProxyHeaders,
    buildVeritieUpstreamUrl,
    extractForwardableClientHeaders,
    isAllowedVeritieProxyPath,
    proxyVeritieRequest,
    type VeritieProxyConfig,
} from "@/lib/veritie/proxy-request";

const testConfig: VeritieProxyConfig = {
    baseUrl: "http://veritie.test",
    pipelineAlias: "veritie-personal",
    apiKey: "server-secret",
};

if (!("Response" in globalThis)) {
    class MockResponse {
        status: number;
        statusText: string;
        private payload: string;
        private headersMap: Headers;

        constructor(body?: BodyInit | null, init?: ResponseInit) {
            this.status = init?.status ?? 200;
            this.statusText = init?.statusText ?? "";
            this.headersMap = new Headers(init?.headers);
            this.payload = typeof body === "string" ? body : "";
        }

        get headers() {
            return this.headersMap;
        }

        async arrayBuffer() {
            const bytes = new Uint8Array(this.payload.length);
            for (let index = 0; index < this.payload.length; index += 1) {
                bytes[index] = this.payload.charCodeAt(index);
            }
            return bytes.buffer;
        }

        async json() {
            return JSON.parse(this.payload);
        }
    }

    (globalThis as { Response?: unknown }).Response = MockResponse;
}

describe("lib/veritie/proxy-request", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("builds upstream URLs from path segments and search", () => {
        expect(
            buildVeritieUpstreamUrl(
                testConfig,
                ["jobs", "job_1"],
                "?expand=transcript",
            ),
        ).toBe("http://veritie.test/v1/jobs/job_1?expand=transcript");
    });

    it("injects server auth and pipeline headers", () => {
        const headers = buildVeritieProxyHeaders(testConfig, {
            contentType: "application/json",
            forwardHeaders: {
                "Idempotency-Key": "create-1",
                Authorization: "Bearer client-forged",
                "X-Veritie-Pipeline": "client-forged",
            },
        });

        expect(headers.get("Authorization")).toBe("Bearer server-secret");
        expect(headers.get("X-Veritie-Pipeline")).toBe("veritie-personal");
        expect(headers.get("Content-Type")).toBe("application/json");
        expect(headers.get("Idempotency-Key")).toBe("create-1");
    });

    it("strips sensitive client headers before forwarding", () => {
        const requestHeaders = new Headers({
            Authorization: "Bearer client",
            "X-Veritie-Pipeline": "client",
            "X-API-Key": "client-key",
            cookie: "session=secret",
            "Idempotency-Key": "create-1",
            "Content-Type": "application/json",
        });

        expect(extractForwardableClientHeaders(requestHeaders)).toEqual({
            "idempotency-key": "create-1",
        });
    });

    it("allows only SDK job paths", () => {
        expect(isAllowedVeritieProxyPath("POST", ["jobs"])).toBe(true);
        expect(isAllowedVeritieProxyPath("GET", ["pipeline", "config"])).toBe(true);
        expect(isAllowedVeritieProxyPath("GET", ["jobs", "job_1"])).toBe(true);
        expect(
            isAllowedVeritieProxyPath("POST", ["jobs", "job_1", "upload-finalize"]),
        ).toBe(true);
        expect(isAllowedVeritieProxyPath("GET", ["jobs"])).toBe(false);
        expect(isAllowedVeritieProxyPath("POST", ["admin", "secrets"])).toBe(false);
    });

    it("rejects disallowed proxy paths", async () => {
        const mockFetch = jest.fn<typeof fetch>();

        await expect(
            proxyVeritieRequest(
                {
                    method: "GET",
                    pathSegments: ["admin", "secrets"],
                },
                testConfig,
                mockFetch,
            ),
        ).rejects.toThrow(/not allowed/i);

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("forwards GET requests to Veritie with injected headers", async () => {
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue(
            new Response(JSON.stringify({ job_id: "job_1" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
        );

        const response = await proxyVeritieRequest(
            {
                method: "GET",
                pathSegments: ["jobs", "job_1"],
                search: "",
            },
            testConfig,
            mockFetch,
        );

        expect(mockFetch).toHaveBeenCalledWith(
            "http://veritie.test/v1/jobs/job_1",
            expect.objectContaining({
                method: "GET",
            }),
        );

        const init = mockFetch.mock.calls[0]?.[1];
        const headers = init?.headers as Headers;
        expect(headers.get("Authorization")).toBe("Bearer server-secret");
        expect(headers.get("X-Veritie-Pipeline")).toBe("veritie-personal");

        expect(response.status).toBe(200);
    });

    it("forwards POST bodies to Veritie", async () => {
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue(
            new Response(JSON.stringify({ job_id: "job_new" }), {
                status: 201,
                headers: { "content-type": "application/json" },
            }),
        );

        await proxyVeritieRequest(
            {
                method: "POST",
                pathSegments: ["jobs"],
                body: JSON.stringify({ audio_content_type: "audio/webm" }),
                contentType: "application/json",
            },
            testConfig,
            mockFetch,
        );

        expect(mockFetch).toHaveBeenCalledWith(
            "http://veritie.test/v1/jobs",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ audio_content_type: "audio/webm" }),
            }),
        );
    });
});

describe("getVeritieProxyConfig", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("throws when proxy env is missing", async () => {
        process.env = {
            ...originalEnv,
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
        };
        delete process.env.VERITIE_API_URL;

        const { getVeritieProxyConfig } = await import("@/lib/veritie/proxy-request");

        expect(() => getVeritieProxyConfig()).toThrow(
            /VERITIE_API_URL and VERITIE_PIPELINE_ALIAS/,
        );
    });

    it("reads config from server env", async () => {
        process.env = {
            ...originalEnv,
            VERITIE_API_URL: "http://veritie.test/",
            VERITIE_PIPELINE_ALIAS: "veritie-personal",
            VERITIE_API_KEY: "server-secret",
        };

        const { getVeritieProxyConfig } = await import("@/lib/veritie/proxy-request");

        expect(getVeritieProxyConfig()).toEqual({
            baseUrl: "http://veritie.test",
            pipelineAlias: "veritie-personal",
            apiKey: "server-secret",
        });
    });
});
