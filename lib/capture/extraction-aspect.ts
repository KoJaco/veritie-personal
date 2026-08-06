import type { AspectKey } from "@/lib/domain/aspect";
import { ASPECT_DEFINITIONS } from "@/lib/domain/aspect";

import {
    EXTRACTION_LIST_KEY_ALIASES,
    type VoiceLogExtractionListKey,
} from "@/lib/capture/voice-log-extraction-schema";

const KNOWN_ASPECTS = new Set<AspectKey>(
    ASPECT_DEFINITIONS.map((aspect) => aspect.id),
);

const ASPECT_SORT_ORDER = ASPECT_DEFINITIONS.map((aspect) => aspect.id);

export function normalizeExtractionAspect(value: string | undefined): AspectKey {
    if (value && KNOWN_ASPECTS.has(value as AspectKey)) {
        return value as AspectKey;
    }
    return "personal";
}

export function getExtractionListCandidates(
    payload: Record<string, unknown>,
    listKey: string,
): unknown[] {
    const aliasKeys = EXTRACTION_LIST_KEY_ALIASES[
        listKey as VoiceLogExtractionListKey
    ] ?? [listKey];

    for (const key of aliasKeys) {
        const value = payload[key];
        if (Array.isArray(value)) {
            return value;
        }
    }

    return [];
}

export function collectCandidateAspects(
    candidate: Record<string, unknown>,
): AspectKey[] {
    const aspects: AspectKey[] = [];
    const primary = normalizeExtractionAspect(
        typeof candidate.aspect === "string" ? candidate.aspect : undefined,
    );
    aspects.push(primary);

    if (typeof candidate.secondary_aspect === "string") {
        const secondary = normalizeExtractionAspect(candidate.secondary_aspect);
        if (secondary !== primary) {
            aspects.push(secondary);
        }
    }

    return aspects;
}

export function sortCaptureAspectIds(aspectIds: AspectKey[]): AspectKey[] {
    const unique = new Set(aspectIds);
    return ASPECT_SORT_ORDER.filter((aspect) => unique.has(aspect));
}

export function deriveCaptureAspectIds(
    payload: Record<string, unknown>,
    extractionListKeys: readonly string[],
): AspectKey[] {
    const aspectSet = new Set<AspectKey>();

    for (const listKey of extractionListKeys) {
        const candidates = getExtractionListCandidates(payload, listKey);
        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== "object") {
                continue;
            }
            for (const aspect of collectCandidateAspects(
                candidate as Record<string, unknown>,
            )) {
                aspectSet.add(aspect);
            }
        }
    }

    if (aspectSet.size === 0) {
        return ["personal"];
    }

    return sortCaptureAspectIds([...aspectSet]);
}

export function deriveCaptureTitle(payload: Record<string, unknown>): string | null {
    const summary = payload.capture_summary;
    if (typeof summary === "string" && summary.trim()) {
        return summary.trim().slice(0, 500);
    }

    return null;
}

const RESERVED_CANDIDATE_KEYS = new Set([
    "aspect",
    "secondary_aspect",
    "title",
    "name",
    "confidence",
]);

export function resolveExtractionCandidateTitle(
    listKey: string,
    candidate: Record<string, unknown>,
): string {
    if (typeof candidate.title === "string" && candidate.title.trim()) {
        return candidate.title.trim();
    }

    if (typeof candidate.name === "string" && candidate.name.trim()) {
        return candidate.name.trim();
    }

    if (
        (listKey === "money_entries" || listKey === "expenses") &&
        typeof candidate.description === "string" &&
        candidate.description.trim()
    ) {
        return candidate.description.trim();
    }

    return listKey.replace(/_/g, " ");
}

export function splitExtractionCandidateFields(
    candidate: Record<string, unknown>,
): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(candidate)) {
        if (!RESERVED_CANDIDATE_KEYS.has(key)) {
            fields[key] = value;
        }
    }

    return fields;
}
