import { updateExtractedValueAttributes as updateStubExtractedValueAttributes } from "@/lib/data-source/captures-read-model";
import { updateExtractedValueReviewState as updateStubExtractedValueReviewState } from "@/lib/data-source/timeline-read-model";
import type { ReviewState } from "@/lib/domain/extraction";
import type { ExtractedValuesAdapter } from "../types";

export const stubExtractedValuesAdapter: ExtractedValuesAdapter = {
    updateExtractedValueReviewState: async (extractedValueId, reviewState) =>
        updateStubExtractedValueReviewState(
            extractedValueId,
            reviewState as ReviewState,
        ),
    updateExtractedValueAttributes: async (extractedValueId, attributes) =>
        updateStubExtractedValueAttributes(extractedValueId, attributes),
};
