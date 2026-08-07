import { render, screen } from "@testing-library/react";
import { TimelineEventRow } from "@/app/(app)/timeline/_components/TimelineEventRow";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";

const item: TimelineIndexItem = {
    id: "timeline_extracted_task_medibank",
    type: "task_detected",
    title: "Call Medibank about the claim",
    aspect: "admin",
    occurredAt: "2026-08-01T08:22:30.000Z",
    captureId: "capture_seed_morning_log",
    extractedValueId: "extracted_task_medibank",
    extractedObjectType: "task",
    reviewState: "pending",
    extractedValue: {
        id: "extracted_task_medibank",
        extractionRunId: "extraction_run_morning",
        captureId: "capture_seed_morning_log",
        objectType: "task",
        aspect: "admin",
        title: "Call Medibank about the claim",
        fields: { dueAt: "2026-08-02T00:00:00.000Z" },
        confidence: 0.86,
        reviewState: "pending",
        createdAt: "2026-08-01T08:22:30.000Z",
        updatedAt: "2026-08-01T08:22:30.000Z",
    },
};

describe("TimelineEventRow", () => {
    it("shows extracted fields instead of capture summary", () => {
        render(
            <TimelineEventRow
                item={{ ...item, summary: "Morning capture summary" }}
                onSelect={jest.fn()}
                onReviewUpdated={jest.fn()}
            />,
        );

        expect(screen.getByText(/2026/i)).toBeInTheDocument();
        expect(
            screen.queryByText("Morning capture summary"),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders accept and reject for pending items", () => {
        render(
            <TimelineEventRow
                item={item}
                onSelect={jest.fn()}
                onReviewUpdated={jest.fn()}
            />,
        );

        expect(screen.getAllByRole("button", { name: /accept/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: /reject/i }).length).toBeGreaterThan(0);
    });

    it("shows undo for confirmed items", () => {
        render(
            <TimelineEventRow
                item={{ ...item, reviewState: "confirmed" }}
                reviewState="confirmed"
                onSelect={jest.fn()}
                onReviewUpdated={jest.fn()}
            />,
        );

        expect(screen.getAllByRole("button", { name: /undo/i }).length).toBeGreaterThan(0);
        expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
    });
});
