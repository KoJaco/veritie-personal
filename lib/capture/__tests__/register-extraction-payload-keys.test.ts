import { registerExtractionListKeysFromPayload } from "@/lib/capture/register-extraction-payload-keys";
import {
    parseExtractedValueId,
    resetRegisteredExtractionListKeysForTests,
} from "@/lib/capture/extracted-value-path";

describe("registerExtractionListKeysFromPayload", () => {
    beforeEach(() => {
        resetRegisteredExtractionListKeysForTests();
    });

    it("registers array-valued payload keys for ID parsing", () => {
        registerExtractionListKeysFromPayload({
            custom_entities: [{ title: "One" }],
            capture_summary: "hello",
        });

        const parsed = parseExtractedValueId(
            "extracted_capture_seed_custom_entities_0",
        );
        expect(parsed).toEqual({
            captureId: "capture_seed",
            listKey: "custom_entities",
            index: 0,
        });
    });
});
