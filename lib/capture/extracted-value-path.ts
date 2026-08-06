import { VOICE_LOG_EXTRACTION_LIST_KEYS } from "@/lib/capture/voice-log-extraction-schema";
import { joinPointerPath, pointerForProperty } from "@/lib/evidence-index/json-pointer";

export type ParsedExtractedValueId = {
    captureId: string;
    listKey: string;
    index: number;
};

const defaultListKeys: string[] = [...VOICE_LOG_EXTRACTION_LIST_KEYS];
let registeredListKeys: string[] = [...defaultListKeys];

function listKeysByLength(): string[] {
    return [...new Set(registeredListKeys)].sort(
        (left, right) => right.length - left.length,
    );
}

/** Register pipeline list keys so ID parsing matches dynamic Veritie schemas. */
export function registerExtractionListKeys(keys: readonly string[]): void {
    registeredListKeys = [...new Set([...defaultListKeys, ...keys])];
}

/** Reset registered keys (tests). */
export function resetRegisteredExtractionListKeysForTests(): void {
    registeredListKeys = [...defaultListKeys];
}

export function buildExtractedValueId(
    captureId: string,
    listKey: string,
    index: number,
): string {
    return `extracted_${captureId}_${listKey}_${index}`;
}

function parseWithKnownListKeys(
    withoutIndex: string,
    index: number,
): ParsedExtractedValueId | null {
    for (const listKey of listKeysByLength()) {
        const suffix = `_${listKey}`;
        if (withoutIndex.endsWith(suffix)) {
            const captureId = withoutIndex.slice(0, -suffix.length);
            if (captureId) {
                return { captureId, listKey, index };
            }
        }
    }
    return null;
}

function parseWithCapturePrefixFallback(
    withoutIndex: string,
    index: number,
): ParsedExtractedValueId | null {
    if (!withoutIndex.startsWith("capture_")) {
        return null;
    }

    const lastSeparator = withoutIndex.lastIndexOf("_");
    if (lastSeparator <= "capture_".length) {
        return null;
    }

    const captureId = withoutIndex.slice(0, lastSeparator);
    const listKey = withoutIndex.slice(lastSeparator + 1);
    if (!captureId || !listKey) {
        return null;
    }

    return { captureId, listKey, index };
}

export function parseExtractedValueId(id: string): ParsedExtractedValueId | null {
    if (!id.startsWith("extracted_")) {
        return null;
    }

    const remainder = id.slice("extracted_".length);
    const indexMatch = remainder.match(/_(\d+)$/);
    if (!indexMatch) {
        return null;
    }

    const index = Number(indexMatch[1]);
    if (!Number.isInteger(index) || index < 0) {
        return null;
    }

    const withoutIndex = remainder.slice(0, -indexMatch[0].length);
    return (
        parseWithKnownListKeys(withoutIndex, index) ??
        parseWithCapturePrefixFallback(withoutIndex, index)
    );
}

export function buildEntityPointer(listKey: string, index: number): string {
    return joinPointerPath(listKey, String(index));
}

export function buildCandidateFieldPointer(
    listKey: string,
    index: number,
    fieldKey: string,
): string {
    return pointerForProperty(buildEntityPointer(listKey, index), fieldKey);
}

export function buildTimelineEventIdForExtractedValue(
    extractedValueId: string,
): string {
    return `timeline_${extractedValueId}`;
}
