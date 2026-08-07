import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import {
    formatPrimitiveValue,
    isPrimitiveArtifactValue,
} from "@/lib/artifact-display";

export function resolveExtractedFieldQuote({
    fieldKey,
    fieldValue,
    captureDetail,
    extractedValueId,
}: {
    fieldKey: string;
    fieldValue: unknown;
    captureDetail?: CaptureDetailReadModel | null;
    extractedValueId?: string;
}): string | null {
    if (fieldKey === "source_quote" && typeof fieldValue === "string") {
        const trimmed = fieldValue.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    if (captureDetail && extractedValueId) {
        for (const anchor of captureDetail.sourceAnchors) {
            if (anchor.extractedValueId !== extractedValueId) {
                continue;
            }
            const quote = anchor.quote?.trim();
            if (quote) {
                return quote;
            }
        }

        const extractedValue = captureDetail.extractedValues.find(
            (value) => value.id === extractedValueId,
        );
        const fields = extractedValue?.fields as
            | Record<string, unknown>
            | undefined;
        const sourceQuote =
            typeof fields?.source_quote === "string"
                ? fields.source_quote.trim()
                : "";
        if (sourceQuote) {
            return sourceQuote;
        }
    }

    if (isPrimitiveArtifactValue(fieldValue)) {
        const formatted = formatPrimitiveValue(fieldValue).trim();
        return formatted.length > 0 ? formatted : null;
    }

    if (typeof fieldValue === "string") {
        const trimmed = fieldValue.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    return null;
}
