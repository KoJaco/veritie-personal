import {
    buildExtractedSummary,
    formatExtractedCountLabel,
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
});
