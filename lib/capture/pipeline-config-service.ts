import type { GetPipelineConfigOptions, PipelineDisplayConfigV1 } from "@veritie/sdk";

import { registerExtractionListKeys } from "@/lib/capture/extracted-value-path";
import {
    resolvePipelineExtractionConfig,
    type PipelineExtractionConfig,
} from "@/lib/capture/pipeline-config";

type GetPipelineConfigFn = (
    options?: GetPipelineConfigOptions,
) => Promise<PipelineDisplayConfigV1>;

const clientExtractionCache = new Map<string, PipelineExtractionConfig>();
const clientDisplayCache = new Map<string, PipelineDisplayConfigV1>();
const clientInFlight = new Map<string, Promise<PipelineExtractionConfig>>();

export function applyResolvedPipelineExtractionConfig(
    config: PipelineExtractionConfig,
): PipelineExtractionConfig {
    registerExtractionListKeys(config.extractionListKeys);
    return config;
}

export function buildPipelineCacheKey(
    baseUrl: string,
    pipelineAlias: string,
): string {
    return `${baseUrl}|${pipelineAlias}`;
}

export async function getClientPipelineExtractionConfig(
    getPipelineConfig: GetPipelineConfigFn,
    cacheKey = "default",
): Promise<PipelineExtractionConfig> {
    const cached = clientExtractionCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const existingFlight = clientInFlight.get(cacheKey);
    if (existingFlight) {
        return existingFlight;
    }

    const flight = getPipelineConfig()
        .then((config) => {
            clientDisplayCache.set(cacheKey, config);
            const resolved = applyResolvedPipelineExtractionConfig(
                resolvePipelineExtractionConfig(config),
            );
            clientExtractionCache.set(cacheKey, resolved);
            return resolved;
        })
        .catch(() => {
            clientDisplayCache.delete(cacheKey);
            const fallback = applyResolvedPipelineExtractionConfig(
                resolvePipelineExtractionConfig(null),
            );
            clientExtractionCache.set(cacheKey, fallback);
            return fallback;
        })
        .finally(() => {
            clientInFlight.delete(cacheKey);
        });

    clientInFlight.set(cacheKey, flight);
    return flight;
}

export function getCachedClientPipelineConfig(
    cacheKey = "default",
): PipelineDisplayConfigV1 | null {
    return clientDisplayCache.get(cacheKey) ?? null;
}

export function getCachedClientPipelineExtractionConfig(
    cacheKey = "default",
): PipelineExtractionConfig | null {
    return clientExtractionCache.get(cacheKey) ?? null;
}

/** Reset client caches (tests). */
export function resetClientPipelineExtractionConfigForTests(): void {
    clientExtractionCache.clear();
    clientDisplayCache.clear();
    clientInFlight.clear();
}
