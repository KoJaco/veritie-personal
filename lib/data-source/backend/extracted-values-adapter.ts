import "server-only";

import { requireAccountScope } from "@/lib/db/repositories/context";
import { updateExtractedValueAttributes as updateDbExtractedValueAttributes } from "@/lib/db/repositories/extracted-values";
import { updateExtractedValueReviewState as updateDbExtractedValueReviewState } from "@/lib/db/repositories/timeline";
import type { ReviewState } from "@/lib/domain/extraction";
import type { ExtractedValuesAdapter } from "../types";

export const backendExtractedValuesAdapter: ExtractedValuesAdapter = {
    updateExtractedValueReviewState: async (extractedValueId, reviewState) => {
        const scope = await requireAccountScope();
        return updateDbExtractedValueReviewState(
            scope,
            extractedValueId,
            reviewState as ReviewState,
        );
    },
    updateExtractedValueAttributes: async (extractedValueId, attributes) => {
        const scope = await requireAccountScope();
        return updateDbExtractedValueAttributes(
            scope,
            extractedValueId,
            attributes,
        );
    },
};
