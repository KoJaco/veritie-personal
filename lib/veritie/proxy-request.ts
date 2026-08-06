import { envServer } from "@/lib/config/env.server";

export type VeritieProxyMethod = "GET" | "POST";

export type VeritieProxyRequestInput = {
    method: VeritieProxyMethod;
    pathSegments: string[];
    search?: string;
    body?: string | null;
    contentType?: string | null;
    forwardHeaders?: Record<string, string>;
    signal?: AbortSignal;
};

export type VeritieProxyConfig = {
    baseUrl: string;
    pipelineAlias: string;
    apiKey?: string;
};

/** Max JSON body size for proxied Veritie POST requests (job create/finalize). */
export const VERITIE_PROXY_MAX_BODY_BYTES = 64 * 1024;

const JOB_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

const STRIPPED_REQUEST_HEADERS = new Set([
    "authorization",
    "x-api-key",
    "x-veritie-pipeline",
    "host",
    "connection",
    "content-length",
    "transfer-encoding",
]);

/** Only forward headers required by the SDK batch/live bootstrap paths. */
const ALLOWED_FORWARD_HEADERS = new Set(["idempotency-key"]);

export function getVeritieProxyConfig(): VeritieProxyConfig {
    const baseUrl = envServer.veritieApiUrl;
    const pipelineAlias = envServer.veritiePipelineAlias;

    if (!baseUrl || !pipelineAlias) {
        throw new Error(
            "VERITIE_API_URL and VERITIE_PIPELINE_ALIAS are required for the Veritie proxy",
        );
    }

    return {
        baseUrl: baseUrl.replace(/\/+$/, ""),
        pipelineAlias,
        apiKey: envServer.veritieApiKey,
    };
}

export function isAllowedVeritieProxyPath(
    method: VeritieProxyMethod,
    pathSegments: string[],
): boolean {
    if (pathSegments.length === 0) {
        return false;
    }

    if (method === "POST" && pathSegments.length === 1 && pathSegments[0] === "jobs") {
        return true;
    }

    if (
        method === "GET" &&
        pathSegments.length === 2 &&
        pathSegments[0] === "pipeline" &&
        pathSegments[1] === "config"
    ) {
        return true;
    }

    if (
        method === "GET" &&
        pathSegments.length === 2 &&
        pathSegments[0] === "jobs" &&
        JOB_ID_PATTERN.test(pathSegments[1])
    ) {
        return true;
    }

    if (
        method === "POST" &&
        pathSegments.length === 3 &&
        pathSegments[0] === "jobs" &&
        JOB_ID_PATTERN.test(pathSegments[1]) &&
        pathSegments[2] === "upload-finalize"
    ) {
        return true;
    }

    return false;
}

export function buildVeritieUpstreamUrl(
    config: VeritieProxyConfig,
    pathSegments: string[],
    search?: string,
): string {
    const path = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
    const suffix = search && search.length > 0 ? search : "";
    return `${config.baseUrl}/v1/${path}${suffix}`;
}

export function buildVeritieProxyHeaders(
    config: VeritieProxyConfig,
    options: {
        contentType?: string | null;
        forwardHeaders?: Record<string, string>;
    } = {},
): Headers {
    const headers = new Headers();

    if (config.apiKey) {
        headers.set("Authorization", `Bearer ${config.apiKey}`);
    }

    headers.set("X-Veritie-Pipeline", config.pipelineAlias);

    if (options.contentType) {
        headers.set("Content-Type", options.contentType);
    }

    if (options.forwardHeaders) {
        for (const [key, value] of Object.entries(options.forwardHeaders)) {
            if (!ALLOWED_FORWARD_HEADERS.has(key.toLowerCase())) {
                continue;
            }
            if (STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
                continue;
            }
            headers.set(key, value);
        }
    }

    return headers;
}

export function extractForwardableClientHeaders(
    requestHeaders: Headers,
): Record<string, string> {
    const forward: Record<string, string> = {};

    requestHeaders.forEach((value, key) => {
        const normalized = key.toLowerCase();
        if (!ALLOWED_FORWARD_HEADERS.has(normalized)) {
            return;
        }
        if (STRIPPED_REQUEST_HEADERS.has(normalized)) {
            return;
        }
        forward[key] = value;
    });

    return forward;
}

export async function proxyVeritieRequest(
    input: VeritieProxyRequestInput,
    config: VeritieProxyConfig = getVeritieProxyConfig(),
    fetchImpl: typeof fetch = fetch,
): Promise<Response> {
    if (!isAllowedVeritieProxyPath(input.method, input.pathSegments)) {
        throw new Error("Veritie proxy path is not allowed");
    }

    const upstreamUrl = buildVeritieUpstreamUrl(
        config,
        input.pathSegments,
        input.search,
    );

    const headers = buildVeritieProxyHeaders(config, {
        contentType: input.contentType,
        forwardHeaders: input.forwardHeaders,
    });

    const upstream = await fetchImpl(upstreamUrl, {
        method: input.method,
        headers,
        body: input.method === "POST" ? (input.body ?? undefined) : undefined,
        signal: input.signal,
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
        responseHeaders.set("content-type", contentType);
    }

    const responseBody = await upstream.arrayBuffer();

    return new Response(responseBody, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
    });
}
