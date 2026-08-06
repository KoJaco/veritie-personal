import { z } from "zod";

export const extractedValueUpdateRequestSchema = z
    .object({
        extractedValueId: z.string().trim().min(1).max(128),
        attributes: z.record(z.string(), z.unknown()),
    })
    .strict();

export const EXTRACTED_VALUE_UPDATE_MAX_ATTRIBUTES = 64;

export const extractedValueUpdateAttributesSchema = z
    .record(z.string().trim().min(1).max(64), z.unknown())
    .refine(
        (value) => Object.keys(value).length <= EXTRACTED_VALUE_UPDATE_MAX_ATTRIBUTES,
        "Too many attributes",
    );
