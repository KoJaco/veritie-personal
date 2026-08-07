import { getTimelineIndex } from "@/lib/data-source/timeline-read-model";

describe("getTimelineIndex", () => {
    it("includes extractedValue on index items when linked", () => {
        const { items } = getTimelineIndex();
        const taskItem = items.find(
            (item) => item.extractedValueId === "extracted_task_medibank",
        );

        expect(taskItem?.extractedValue?.objectType).toBe("task");
        expect(taskItem?.extractedValue?.fields).toMatchObject({
            dueAt: expect.any(String),
        });
    });
});
