import {
    deriveCaptureAspectIds,
    deriveCaptureTitle,
    normalizeExtractionAspect,
    resolveExtractionCandidateTitle,
    splitExtractionCandidateFields,
} from "@/lib/capture/extraction-aspect";

describe("extraction-aspect", () => {
    it("derives unique aspect ids from multiple extraction items", () => {
        const aspectIds = deriveCaptureAspectIds(
            {
                tasks: [
                    { aspect: "work", title: "Email client" },
                    { aspect: "finance", title: "Pay bill" },
                ],
                resources: [
                    {
                        aspect: "personal",
                        secondary_aspect: "admin",
                        name: "GP clinic",
                    },
                ],
            },
            ["tasks", "resources"],
        );

        expect(aspectIds).toEqual(["finance", "work", "personal", "admin"]);
    });

    it("falls back to personal when no aspects are present", () => {
        expect(deriveCaptureAspectIds({}, ["tasks"])).toEqual(["personal"]);
    });

    it("uses capture_summary for capture title", () => {
        expect(
            deriveCaptureTitle({
                capture_summary: "Morning errands and admin follow-ups",
            }),
        ).toBe("Morning errands and admin follow-ups");
    });

    it("resolves titles from name and description fields", () => {
        expect(
            resolveExtractionCandidateTitle("resources", { name: "Medibank" }),
        ).toBe("Medibank");
        expect(
            resolveExtractionCandidateTitle("money_entries", {
                description: "Chemist vitamins",
            }),
        ).toBe("Chemist vitamins");
    });

    it("maps flat schema fields into stored fields bag", () => {
        const fields = splitExtractionCandidateFields({
            aspect: "finance",
            title: "Pay rent",
            source_quote: "pay rent tomorrow",
            amount: 1200,
        });

        expect(fields).toEqual({
            source_quote: "pay rent tomorrow",
            amount: 1200,
        });
    });

    it("normalizes unknown aspects to personal", () => {
        expect(normalizeExtractionAspect("unknown")).toBe("personal");
        expect(normalizeExtractionAspect("fitness")).toBe("fitness");
    });
});
