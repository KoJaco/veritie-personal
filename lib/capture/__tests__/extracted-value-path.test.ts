import {
    buildCandidateFieldPointer,
    buildExtractedValueId,
    parseExtractedValueId,
    registerExtractionListKeys,
    resetRegisteredExtractionListKeysForTests,
} from "@/lib/capture/extracted-value-path";

describe("extracted-value-path", () => {
    afterEach(() => {
        resetRegisteredExtractionListKeysForTests();
    });

    it("round-trips extracted value ids", () => {
        const captureId = "capture_abc-123";
        const listKey = "reminders";
        const index = 2;
        const id = buildExtractedValueId(captureId, listKey, index);

        expect(parseExtractedValueId(id)).toEqual({
            captureId,
            listKey,
            index,
        });
    });

    it("builds candidate field pointers", () => {
        expect(buildCandidateFieldPointer("events", 0, "title")).toBe(
            "/events/0/title",
        );
    });

    it("parses dynamically registered list keys", () => {
        registerExtractionListKeys(["custom_entity"]);
        const captureId = "capture_abc-123";
        const id = buildExtractedValueId(captureId, "custom_entity", 0);

        expect(parseExtractedValueId(id)).toEqual({
            captureId,
            listKey: "custom_entity",
            index: 0,
        });
    });
});
