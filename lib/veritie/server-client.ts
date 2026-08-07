import "server-only";

import { VeritieSDK } from "@veritie/sdk/client";
import { envServer } from "@/lib/config/env.server";

let cachedClient: VeritieSDK | null = null;

export function getServerVeritieClient(): VeritieSDK {
    if (cachedClient) {
        return cachedClient;
    }

    const baseUrl = envServer.veritieApiUrl;
    const pipelineAlias = envServer.veritiePipelineAlias;

    if (!baseUrl || !pipelineAlias) {
        throw new Error(
            "VERITIE_API_URL and VERITIE_PIPELINE_ALIAS are required for server-side capture persist",
        );
    }

    cachedClient = new VeritieSDK({
        baseUrl,
        pipelineAlias,
        apiKey: envServer.veritieApiKey,
    });

    return cachedClient;
}

/** Reset cached client (tests). */
export function resetServerVeritieClientForTests(): void {
    cachedClient = null;
}
