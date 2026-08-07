import type { ExtractedObjectType } from "@/lib/domain/extraction";

const OBJECT_TYPE_LABELS: Record<ExtractedObjectType, string> = {
    task: "task",
    reminder: "reminder",
    goal: "goal",
    goal_progress: "goal progress",
    money_entry: "money entry",
    event: "event",
    record: "record",
    resource: "resource",
};

export function formatObjectTypeLabel(objectType: string): string {
    if (objectType in OBJECT_TYPE_LABELS) {
        return OBJECT_TYPE_LABELS[objectType as ExtractedObjectType];
    }
    return objectType.replace(/_/g, " ");
}

export function buildExtractedSummary(
    objectTypeCounts: ReadonlyMap<string, number> | Record<string, number>,
): string | null {
    const entries =
        objectTypeCounts instanceof Map
            ? Array.from(objectTypeCounts.entries())
            : Object.entries(objectTypeCounts);

    const parts = entries
        .filter(([, count]) => count > 0)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([objectType, count]) => {
            const label = formatObjectTypeLabel(objectType);
            return count === 1 ? `1 ${label}` : `${count} ${label}s`;
        });

    return parts.length > 0 ? parts.join(", ") : null;
}

export function formatExtractedCountLabel(
    extractedCount: number,
    extractedSummary: string | null,
): string {
    if (extractedCount <= 0) {
        return "0 extracted";
    }
    if (extractedSummary) {
        return `${extractedCount} extracted · ${extractedSummary}`;
    }
    return `${extractedCount} extracted`;
}

export function resolveCaptureSummaryFromPayload(
    payload: unknown,
): string | undefined {
    if (!payload || typeof payload !== "object") {
        return undefined;
    }

    const summary = (payload as Record<string, unknown>).capture_summary;
    if (typeof summary !== "string") {
        return undefined;
    }

    const trimmed = summary.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function applyTimelineItemSummaryFallback<
    T extends { summary?: string },
>(item: T, captureSummary?: string | null): T {
    if (item.summary?.trim()) {
        return item;
    }

    const fallback = captureSummary?.trim();
    if (!fallback) {
        return item;
    }

    return { ...item, summary: fallback };
}
