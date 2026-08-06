import {
    getExtractionListCandidates,
    normalizeExtractionAspect,
    resolveExtractionCandidateTitle,
    splitExtractionCandidateFields,
} from "@/lib/capture/extraction-aspect";
import {
    buildCandidateFieldPointer,
    buildEntityPointer,
} from "@/lib/capture/extracted-value-path";
import { EXTRACTION_LIST_KEY_ALIASES } from "@/lib/capture/voice-log-extraction-schema";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolvePayloadListKey(
    payload: Record<string, unknown>,
    listKey: string,
): string {
    const aliasKeys = EXTRACTION_LIST_KEY_ALIASES[
        listKey as keyof typeof EXTRACTION_LIST_KEY_ALIASES
    ] ?? [listKey];

    for (const key of aliasKeys) {
        if (Array.isArray(payload[key])) {
            return key;
        }
    }

    return listKey;
}

export function mergeCandidateAttributes(
    existing: Record<string, unknown> | undefined,
    attributes: Record<string, unknown>,
): Record<string, unknown> {
    return {
        ...(existing ?? {}),
        ...attributes,
    };
}

export function applyAttributesToExtractionPayload(
    payload: Record<string, unknown> | null | undefined,
    listKey: string,
    index: number,
    attributes: Record<string, unknown>,
): Record<string, unknown> {
    const nextPayload = { ...(payload ?? {}) };
    const payloadListKey = resolvePayloadListKey(nextPayload, listKey);
    const candidates = [...getExtractionListCandidates(nextPayload, listKey)];

    while (candidates.length <= index) {
        candidates.push({});
    }

    const existingCandidate = isRecord(candidates[index]) ? candidates[index] : {};
    candidates[index] = mergeCandidateAttributes(
        existingCandidate as Record<string, unknown>,
        attributes,
    );
    nextPayload[payloadListKey] = candidates;

    return nextPayload;
}

export function deriveTimelineEventSummary(
    candidate: Record<string, unknown>,
): string | undefined {
    const parts: string[] = [];

    if (typeof candidate.location === "string" && candidate.location.trim()) {
        parts.push(candidate.location.trim());
    }
    if (typeof candidate.start_at === "string" && candidate.start_at.trim()) {
        parts.push(candidate.start_at.trim());
    }
    if (typeof candidate.end_at === "string" && candidate.end_at.trim()) {
        parts.push(candidate.end_at.trim());
    }
    if (typeof candidate.remind_at === "string" && candidate.remind_at.trim()) {
        parts.push(`remind ${candidate.remind_at.trim()}`);
    }
    if (typeof candidate.due_at === "string" && candidate.due_at.trim()) {
        parts.push(`due ${candidate.due_at.trim()}`);
    }

    return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function deriveExtractedValueFromCandidate(
    listKey: string,
    candidate: Record<string, unknown>,
): {
    title: string;
    aspect: ReturnType<typeof normalizeExtractionAspect>;
    fields: Record<string, unknown>;
} {
    return {
        title: resolveExtractionCandidateTitle(listKey, candidate),
        aspect: normalizeExtractionAspect(
            typeof candidate.aspect === "string" ? candidate.aspect : undefined,
        ),
        fields: splitExtractionCandidateFields(candidate),
    };
}

export function collectIndexQuoteUpdates(
    listKey: string,
    index: number,
    attributes: Record<string, unknown>,
): Array<{ path: string; quote: string }> {
    const updates: Array<{ path: string; quote: string }> = [];

    for (const [fieldKey, rawValue] of Object.entries(attributes)) {
        if (typeof rawValue !== "string" || !rawValue.trim()) {
            continue;
        }

        if (fieldKey === "source_quote" || fieldKey === "title") {
            updates.push({
                path: buildCandidateFieldPointer(listKey, index, fieldKey),
                quote: rawValue.trim(),
            });
        }
    }

    return updates;
}

export function applyIndexQuoteUpdates(
    indexArtifact: Record<string, unknown> | null | undefined,
    quoteUpdates: Array<{ path: string; quote: string }>,
): Record<string, unknown> | null | undefined {
    if (!indexArtifact || quoteUpdates.length === 0) {
        return indexArtifact;
    }

    const entries = indexArtifact.entries;
    if (!Array.isArray(entries)) {
        return indexArtifact;
    }

    const updateByPath = new Map(
        quoteUpdates.map((update) => [update.path, update.quote]),
    );

    const nextEntries = entries.map((entry) => {
        if (!isRecord(entry)) {
            return entry;
        }

        const path = typeof entry.path === "string" ? entry.path : "";
        const quote = updateByPath.get(path);
        if (quote) {
            return { ...entry, quote };
        }

        return entry;
    });

    return {
        ...indexArtifact,
        entries: nextEntries,
    };
}
