import "server-only";

import {
    resolvePipelineExtractionConfig,
    resolvePipelineExtractionConfigFromDefinitions,
    type PipelineExtractionConfig,
} from "@/lib/capture/pipeline-config";
import { applyResolvedPipelineExtractionConfig } from "@/lib/capture/pipeline-config-service";
import { envServer } from "@/lib/config/env.server";
import type { VeritiePipelineConfigClient } from "@/lib/veritie/pipeline-config-client";
import { getServerVeritieClient } from "@/lib/veritie/server-client";

const serverExtractionCache = new Map<string, PipelineExtractionConfig>();
const serverInFlight = new Map<string, Promise<PipelineExtractionConfig>>();

function hasVeritieServerEnv(): boolean {
    return Boolean(envServer.veritieApiUrl && envServer.veritiePipelineAlias);
}

export function buildServerPipelineCacheKey(): string {
    if (!hasVeritieServerEnv()) {
        return "fallback";
    }
    return `${envServer.veritieApiUrl}|${envServer.veritiePipelineAlias}`;
}

export async function getServerPipelineExtractionConfig(
    veritie: VeritiePipelineConfigClient,
    cacheKey = buildServerPipelineCacheKey(),
): Promise<PipelineExtractionConfig> {
    const cached = serverExtractionCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const existingFlight = serverInFlight.get(cacheKey);
    if (existingFlight) {
        return existingFlight;
    }

    const flight = (async () => {
        try {
            const config = await veritie.getPipelineConfig();
            const resolved = applyResolvedPipelineExtractionConfig(
                resolvePipelineExtractionConfig(config),
            );
            serverExtractionCache.set(cacheKey, resolved);
            return resolved;
        } catch {
            const fallback = applyResolvedPipelineExtractionConfig(
                resolvePipelineExtractionConfig(null),
            );
            serverExtractionCache.set(cacheKey, fallback);
            return fallback;
        } finally {
            serverInFlight.delete(cacheKey);
        }
    })();

    serverInFlight.set(cacheKey, flight);
    return flight;
}

/** Glossary labels for UI; falls back when Veritie env is missing or fetch fails. */
export async function getServerGlossaryLabels(): Promise<Record<string, string>> {
    if (!hasVeritieServerEnv()) {
        const fallback = applyResolvedPipelineExtractionConfig(
            resolvePipelineExtractionConfigFromDefinitions(),
        );
        return fallback.glossaryLabels;
    }

    try {
        const config = await getServerPipelineExtractionConfig(
            getServerVeritieClient(),
        );
        return config.glossaryLabels;
    } catch {
        const fallback = applyResolvedPipelineExtractionConfig(
            resolvePipelineExtractionConfig(null),
        );
        return fallback.glossaryLabels;
    }
}

/** Reset server caches (tests). */
export function resetServerPipelineExtractionConfigForTests(): void {
    serverExtractionCache.clear();
    serverInFlight.clear();
}
