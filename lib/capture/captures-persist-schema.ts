import { z } from "zod";

import {
    VOICE_LOG_EXTRACTION_LIST_KEYS,
    type VoiceLogExtractionListKey,
} from "@/lib/capture/voice-log-extraction-schema";

const JOB_STATUSES = [
    "awaiting_upload",
    "queued",
    "running",
    "completed",
    "partial_success",
    "failed",
    "cancelled",
] as const;

export const CAPTURES_PERSIST_MAX_BODY_BYTES = 256 * 1024;
export const MAX_TRANSCRIPT_TEXT_LENGTH = 100_000;
export const MAX_TRANSCRIPT_SEGMENTS = 500;
export const MAX_EXTRACTION_ITEMS_PER_LIST = 100;
export const MAX_EXTRACTION_FIELD_KEYS = 50;

const transcriptSegmentSchema = z.object({
    index: z.number().int().nonnegative().optional(),
    start_ms: z.number().nonnegative().optional(),
    end_ms: z.number().nonnegative().optional(),
    text: z.string().max(10_000).optional(),
    speaker_label: z.string().max(128).optional(),
    confidence: z.number().min(0).max(1).optional(),
});

const extractionWarningSchema = z
    .object({
        reason: z.string().max(2000),
    })
    .passthrough();

const extractionCandidateSchema = z
    .object({
        aspect: z.string().max(64).optional(),
        secondary_aspect: z.string().max(64).optional(),
        title: z.string().max(500).optional(),
        name: z.string().max(500).optional(),
        description: z.string().max(2000).optional(),
        source_quote: z.string().max(10_000).optional(),
        confidence: z.number().min(0).max(1).optional(),
    })
    .passthrough()
    .refine(
        (candidate) => Object.keys(candidate).length <= MAX_EXTRACTION_FIELD_KEYS + 8,
        { message: "Too many extraction fields" },
    );

export function buildExtractionPayloadSchema(
    extractionListKeys: readonly string[] = VOICE_LOG_EXTRACTION_LIST_KEYS,
) {
    return z
        .object({
            capture_summary: z.string().max(2000).optional(),
            extraction_warnings: z
                .array(extractionWarningSchema)
                .max(50)
                .optional(),
            ...Object.fromEntries(
                extractionListKeys.map((key) => [
                    key,
                    z
                        .array(extractionCandidateSchema)
                        .max(MAX_EXTRACTION_ITEMS_PER_LIST)
                        .optional(),
                ]),
            ),
        })
        .passthrough()
        .optional();
}

const defaultExtractionPayloadSchema = buildExtractionPayloadSchema(
    VOICE_LOG_EXTRACTION_LIST_KEYS,
);

const evidenceIndexEntrySchema = z.object({
    path: z.string().max(512),
    status: z.string().max(64),
    quote: z.string().max(10_000).optional(),
    segment_ids: z.array(z.string().max(128)).max(50),
    start_ms: z.number().nonnegative().optional(),
    end_ms: z.number().nonnegative().optional(),
    match_method: z.string().max(64).optional(),
    confidence: z.number().min(0).max(1).optional(),
    unresolved_reason: z.string().max(256).optional(),
});

const evidenceIndexArtifactSchema = z.object({
    status: z.enum(["completed", "failed"]),
    builder_version: z.string().max(64),
    entries: z.array(evidenceIndexEntrySchema).max(2000),
    error_class: z.string().max(128).optional(),
});

export function buildVeritieJobPersistSchema(
    extractionListKeys: readonly string[] = VOICE_LOG_EXTRACTION_LIST_KEYS,
) {
    return z.object({
        job_id: z.string().trim().min(1).max(128),
        status: z.enum(JOB_STATUSES),
        transcript: z
            .object({
                text: z.string().max(MAX_TRANSCRIPT_TEXT_LENGTH).optional(),
                language: z.string().max(32).optional(),
                duration_ms: z.number().nonnegative().optional(),
                segments: z
                    .array(transcriptSegmentSchema)
                    .max(MAX_TRANSCRIPT_SEGMENTS)
                    .optional(),
            })
            .optional(),
        extraction: z
            .object({
                payload: buildExtractionPayloadSchema(extractionListKeys),
            })
            .optional(),
        index: evidenceIndexArtifactSchema.optional(),
    });
}

export const capturesPersistRequestSchema = z
    .object({
        jobId: z.string().trim().min(1).max(128),
    })
    .strict();

export const veritieJobPersistSchema = buildVeritieJobPersistSchema(
    VOICE_LOG_EXTRACTION_LIST_KEYS,
);

export type CapturesPersistRequest = z.infer<typeof capturesPersistRequestSchema>;
export type ValidatedVeritieJob = z.infer<typeof veritieJobPersistSchema>;

export type VoiceLogExtractionListKeys = VoiceLogExtractionListKey[];
