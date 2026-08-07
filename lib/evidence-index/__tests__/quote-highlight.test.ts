import {
    collectTranscriptHighlightRanges,
    renderMultiHighlightedText,
} from "@/lib/evidence-index/quote-highlight";

describe("quote-highlight multi-range", () => {
    const transcript = "Buy milk tomorrow and call dentist on Friday.";

    it("collects and merges multiple quote ranges", () => {
        const ranges = collectTranscriptHighlightRanges(transcript, [
            { quote: "Buy milk", primary: true },
            { quote: "call dentist", primary: false },
        ]);

        expect(ranges.length).toBeGreaterThanOrEqual(2);
        expect(ranges.some((range) => range.primary)).toBe(true);
    });

    it("renders non-overlapping highlighted parts", () => {
        const ranges = collectTranscriptHighlightRanges(transcript, [
            { quote: "Buy milk" },
            { quote: "Friday" },
        ]);

        const parts = renderMultiHighlightedText(transcript, ranges);
        const highlighted = parts.filter((part) => part.highlighted);

        expect(highlighted.length).toBeGreaterThanOrEqual(2);
        expect(parts.map((part) => part.text).join("")).toBe(transcript);
    });
});
