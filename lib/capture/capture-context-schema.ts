import { z } from "zod";

export const CAPTURE_LOCATION_LABEL_MAX_LENGTH = 120;

export const captureLocationLabelSchema = z
    .string()
    .trim()
    .max(CAPTURE_LOCATION_LABEL_MAX_LENGTH)
    .optional();

export function normalizeCaptureLocationLabel(
    value: string | null | undefined,
): string | undefined {
    if (value == null) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
