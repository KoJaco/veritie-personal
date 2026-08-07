import {
    applyTimelineItemSummaryFallback,
    buildExtractedSummary,
    formatExtractedCountLabel,
    resolveCaptureSummaryFromPayload,
} from "@/lib/capture/extraction-summary";

describe("extraction-summary", () => {
    it("formats object type breakdown", () => {
        expect(
            buildExtractedSummary({
                event: 1,
                reminder: 1,
            }),
        ).toBe("1 event, 1 reminder");
    });

    it("formats capture list label with summary", () => {
        expect(
            formatExtractedCountLabel(2, "1 event, 1 reminder"),
        ).toBe("2 extracted · 1 event, 1 reminder");
    });

    it("reads capture_summary from extraction payload", () => {
        expect(
            resolveCaptureSummaryFromPayload({
                capture_summary: "  Groceries and errands  ",
            }),
        ).toBe("Groceries and errands");
    });

    it("applies summary fallback when timeline item summary is empty", () => {
        const item = applyTimelineItemSummaryFallback(
            { summary: "" },
            "Voice log summary",
        );

        expect(item.summary).toBe("Voice log summary");
    });
});
