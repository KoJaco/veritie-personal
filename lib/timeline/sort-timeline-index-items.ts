import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";

type TimelineIndexSortable = Pick<
    TimelineIndexItem,
    "occurredAt" | "createdAt" | "id"
>;

export function compareTimelineIndexItems(
    a: TimelineIndexSortable,
    b: TimelineIndexSortable,
): number {
    const byOccurred =
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    if (byOccurred !== 0) {
        return byOccurred;
    }

    if (a.createdAt && b.createdAt) {
        const byCreated =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (byCreated !== 0) {
            return byCreated;
        }
    }

    return a.id.localeCompare(b.id);
}

export function sortTimelineIndexItems<T extends TimelineIndexItem>(
    items: T[],
): T[] {
    return [...items].sort(compareTimelineIndexItems);
}
