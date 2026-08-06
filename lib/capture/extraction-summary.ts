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
