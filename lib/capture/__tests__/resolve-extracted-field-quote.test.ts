import { resolveExtractedFieldQuote } from "@/lib/capture/resolve-extracted-field-quote";

describe("resolveExtractedFieldQuote", () => {
    it("returns source_quote field value directly", () => {
        expect(
            resolveExtractedFieldQuote({
                fieldKey: "source_quote",
                fieldValue: "buy milk tomorrow",
            }),
        ).toBe("buy milk tomorrow");
    });

    it("falls back to capture anchor quote for the extracted value", () => {
        expect(
            resolveExtractedFieldQuote({
                fieldKey: "title",
                fieldValue: "Milk reminder",
                extractedValueId: "ev-1",
                captureDetail: {
                    sourceAnchors: [
                        {
                            extractedValueId: "ev-1",
                            quote: "remind me about milk",
                        },
                    ],
                } as never,
            }),
        ).toBe("remind me about milk");
    });
});
