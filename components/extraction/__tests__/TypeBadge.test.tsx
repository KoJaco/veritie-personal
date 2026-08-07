import { render, screen } from "@testing-library/react";
import { TypeBadge } from "@/components/extraction/TypeBadge";
import { resolveTimelineItemObjectType } from "@/lib/extraction/object-type-ui";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";

describe("TypeBadge", () => {
    it("renders task icon and label", () => {
        render(<TypeBadge objectType="task" />);
        expect(screen.getByText("Task")).toBeInTheDocument();
    });

    it("renders money label for money_entry", () => {
        render(<TypeBadge objectType="money_entry" />);
        expect(screen.getByText("Money")).toBeInTheDocument();
    });
});

describe("resolveTimelineItemObjectType", () => {
    const baseItem: TimelineIndexItem = {
        id: "timeline_1",
        type: "task_detected",
        title: "Call Medibank",
        aspect: "admin",
        occurredAt: "2026-08-01T08:22:30.000Z",
    };

    it("prefers extractedObjectType", () => {
        expect(
            resolveTimelineItemObjectType({
                ...baseItem,
                extractedObjectType: "reminder",
            }),
        ).toBe("reminder");
    });

    it("maps timeline event types", () => {
        expect(
            resolveTimelineItemObjectType({
                ...baseItem,
                type: "expense_detected",
            }),
        ).toBe("money_entry");
    });

    it("returns null for meta events", () => {
        expect(
            resolveTimelineItemObjectType({
                ...baseItem,
                type: "capture_created",
            }),
        ).toBeNull();
    });
});
