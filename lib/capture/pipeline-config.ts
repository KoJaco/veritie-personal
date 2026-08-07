import type { PipelineDisplayConfigV1 } from "@veritie/sdk";

import {
    DEFAULT_VOICE_LOG_GLOSSARY_DEFINITION,
    DEFAULT_VOICE_LOG_SCHEMA_DEFINITION,
    VOICE_LOG_EXTRACTION_EVENT_TYPES,
    VOICE_LOG_EXTRACTION_LIST_KEYS,
    VOICE_LOG_EXTRACTION_OBJECT_TYPES,
    type VoiceLogExtractionListKey,
} from "@/lib/capture/voice-log-extraction-schema";
import type { ExtractedObjectType } from "@/lib/domain/extraction";

export type PipelineExtractionConfig = {
    extractionListKeys: string[];
    objectTypesByKey: Record<string, ExtractedObjectType>;
    eventTypesByKey: Record<string, string>;
    glossaryLabels: Record<string, string>;
    schemaVersionId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readEntityKey(entity: Record<string, unknown>): string | null {
    const key =
        typeof entity.key === "string"
            ? entity.key
            : typeof entity.collection_key === "string"
              ? entity.collection_key
              : null;
    return key?.trim() ? key.trim() : null;
}

export function parseExtractionListKeys(
    schemaDefinition: unknown,
): string[] | null {
    if (!isRecord(schemaDefinition)) {
        return null;
    }

    const entities = schemaDefinition.entities;
    if (!Array.isArray(entities)) {
        return null;
    }

    const keys: string[] = [];
    for (const entity of entities) {
        if (!isRecord(entity)) {
            continue;
        }
        const key = readEntityKey(entity);
        if (key) {
            keys.push(key);
        }
    }

    return keys.length > 0 ? keys : null;
}

export function parseObjectTypesByKey(
    schemaDefinition: unknown,
): Record<string, ExtractedObjectType> | null {
    if (!isRecord(schemaDefinition)) {
        return null;
    }

    const entities = schemaDefinition.entities;
    if (!Array.isArray(entities)) {
        return null;
    }

    const objectTypes: Record<string, ExtractedObjectType> = {};
    for (const entity of entities) {
        if (!isRecord(entity)) {
            continue;
        }
        const key = readEntityKey(entity);
        const objectType =
            typeof entity.object_type === "string"
                ? entity.object_type
                : null;
        if (key && objectType) {
            objectTypes[key] = objectType as ExtractedObjectType;
        }
    }

    return Object.keys(objectTypes).length > 0 ? objectTypes : null;
}

export function parseGlossaryLabels(
    glossaryDefinition: unknown,
): Record<string, string> {
    if (!isRecord(glossaryDefinition)) {
        return {};
    }

    const labels: Record<string, string> = {};

    const entries = glossaryDefinition.entries;
    if (Array.isArray(entries)) {
        for (const entry of entries) {
            if (!isRecord(entry)) {
                continue;
            }
            const key =
                typeof entry.key === "string" ? entry.key.trim() : "";
            const label =
                typeof entry.label === "string" ? entry.label.trim() : "";
            if (key && label) {
                labels[key] = label;
            }
        }
    }

    for (const [rawKey, rawValue] of Object.entries(glossaryDefinition)) {
        if (rawKey === "entries" || typeof rawValue !== "string") {
            continue;
        }
        const label = rawValue.trim();
        if (label) {
            labels[rawKey] = label;
        }
    }

    return labels;
}

function buildFallbackConfig(): PipelineExtractionConfig {
    const extractionListKeys = [...VOICE_LOG_EXTRACTION_LIST_KEYS];
    const objectTypesByKey: Record<string, ExtractedObjectType> = {
        ...VOICE_LOG_EXTRACTION_OBJECT_TYPES,
    };
    const eventTypesByKey: Record<string, string> = {
        ...VOICE_LOG_EXTRACTION_EVENT_TYPES,
    };

    return {
        extractionListKeys,
        objectTypesByKey,
        eventTypesByKey,
        glossaryLabels: parseGlossaryLabels(DEFAULT_VOICE_LOG_GLOSSARY_DEFINITION),
        schemaVersionId: null,
    };
}

export function resolvePipelineExtractionConfig(
    config: PipelineDisplayConfigV1 | null,
): PipelineExtractionConfig {
    const fallback = buildFallbackConfig();

    if (!config) {
        return fallback;
    }

    const parsedKeys =
        parseExtractionListKeys(config.schema?.definition) ??
        fallback.extractionListKeys;
    const parsedObjectTypes =
        parseObjectTypesByKey(config.schema?.definition) ?? {};

    const objectTypesByKey: Record<string, ExtractedObjectType> = {
        ...fallback.objectTypesByKey,
        ...parsedObjectTypes,
    };

    const eventTypesByKey: Record<string, string> = { ...fallback.eventTypesByKey };
    for (const key of parsedKeys) {
        if (!eventTypesByKey[key] && objectTypesByKey[key]) {
            const voiceKey = key as VoiceLogExtractionListKey;
            eventTypesByKey[key] =
                VOICE_LOG_EXTRACTION_EVENT_TYPES[voiceKey] ??
                `${objectTypesByKey[key]}_detected`;
        }
    }

    const glossaryLabels = {
        ...fallback.glossaryLabels,
        ...parseGlossaryLabels(config.glossary?.definition),
    };

    return {
        extractionListKeys: parsedKeys,
        objectTypesByKey,
        eventTypesByKey,
        glossaryLabels,
        schemaVersionId: config.schema?.version_id ?? null,
    };
}

export function resolvePipelineExtractionConfigFromDefinitions(
    schemaDefinition: unknown = DEFAULT_VOICE_LOG_SCHEMA_DEFINITION,
    glossaryDefinition: unknown = DEFAULT_VOICE_LOG_GLOSSARY_DEFINITION,
    schemaVersionId: string | null = null,
): PipelineExtractionConfig {
    return resolvePipelineExtractionConfig({
        version: "v1",
        app: { id: "fallback", name: "Fallback" },
        pipeline: { id: "fallback", name: "Fallback", alias: "fallback" },
        settings: {
            entities_enabled: true,
            actions_enabled: false,
            action_mode: "suggest_only",
            ingest_mode: "batch_first",
        },
        schema: {
            id: "fallback-schema",
            version_id: schemaVersionId ?? "fallback-schema-version",
            version: 1,
            definition: isRecord(schemaDefinition)
                ? schemaDefinition
                : DEFAULT_VOICE_LOG_SCHEMA_DEFINITION,
        },
        glossary: {
            id: "fallback-glossary",
            version_id: "fallback-glossary-version",
            version: 1,
            definition: isRecord(glossaryDefinition)
                ? glossaryDefinition
                : DEFAULT_VOICE_LOG_GLOSSARY_DEFINITION,
        },
        warnings: [],
    });
}
