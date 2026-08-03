import { VeritieSDKError } from "./errors";
import type { VeritieClientConfig } from "./types";

function toHeaders(input?: HeadersInit): Headers {
    return new Headers(input);
}

export async function buildAuthHeaders(
    config: VeritieClientConfig,
    options: { headers?: HeadersInit; pipelineAlias?: string } = {},
): Promise<Headers> {
    const headers = toHeaders(config.headers);

    if (config.getAuthHeaders) {
        const resolved = await config.getAuthHeaders();
        new Headers(resolved).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    if (config.apiKey) {
        const headerName = config.apiKeyHeader ?? "Authorization";
        if (headerName === "Authorization") {
            headers.set("Authorization", `Bearer ${config.apiKey}`);
        } else {
            headers.set("X-API-Key", config.apiKey);
        }
    }

    headers.set("X-Veritie-Pipeline", resolveAppAlias(config, options.pipelineAlias));

    new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
    });

    return headers;
}

function resolveAppAlias(config: VeritieClientConfig, override?: string): string {
    const candidate = override ?? config.pipelineAlias;
    const alias = candidate.trim();
    if (!alias) {
        throw new VeritieSDKError({
            code: "invalid_pipeline_alias",
            message: "pipelineAlias is required for protected server requests",
        });
    }
    return alias;
}
