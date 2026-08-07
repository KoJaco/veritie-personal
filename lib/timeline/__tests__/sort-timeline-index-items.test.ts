import { compareTimelineIndexItems } from "@/lib/timeline/sort-timeline-index-items";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";

function item(
    overrides: Partial<TimelineIndexItem> & Pick<TimelineIndexItem, "id">,
): TimelineIndexItem {
    return {
        type: "task_detected",
        title: "Task",
        aspect: "admin",
        occurredAt: "2026-08-01T08:22:30.000Z",
        createdAt: "2026-08-01T08:22:30.000Z",
        ...overrides,
    };
}

describe("compareTimelineIndexItems", () => {
    it("keeps a stable order for items with the same occurredAt", () => {
        const items = [
            item({ id: "timeline_task_medibank" }),
            item({ id: "timeline_expense_chemist" }),
            item({ id: "timeline_reminder_rego" }),
        ];

        const firstSort = [...items].sort(compareTimelineIndexItems);
        const secondSort = [...items].sort(compareTimelineIndexItems);

        expect(firstSort.map((entry) => entry.id)).toEqual(
            secondSort.map((entry) => entry.id),
        );
        expect(firstSort.map((entry) => entry.id)).toEqual([
            "timeline_expense_chemist",
            "timeline_reminder_rego",
            "timeline_task_medibank",
        ]);
    });
});
