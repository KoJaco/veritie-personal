import { z } from "zod";

const JOB_STATUSES = [
    "awaiting_upload",
    "queued",
    "running",
    "completed",
    "partial_success",
    "failed",
    "cancelled",
] as const;

const EXTRACTION_LIST_KEYS = [
    "tasks",
    "reminders",
    "goals",
    "goal_progress",
    "expenses",
    "records",
    "resources",
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

const extractionCandidateSchema = z.object({
    aspect: z.string().max(64).optional(),
    title: z.string().max(500).optional(),
    confidence: z.number().min(0).max(1).optional(),
    fields: z
        .record(z.string().max(128), z.unknown())
        .refine(
            (fields) => Object.keys(fields).length <= MAX_EXTRACTION_FIELD_KEYS,
            { message: "Too many extraction fields" },
        )
        .optional(),
});

const extractionPayloadSchema = z
    .object(
        Object.fromEntries(
            EXTRACTION_LIST_KEYS.map((key) => [
                key,
                z.array(extractionCandidateSchema).max(MAX_EXTRACTION_ITEMS_PER_LIST).optional(),
            ]),
        ),
    )
    .passthrough()
    .optional();

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

export const capturesPersistRequestSchema = z
    .object({
        jobId: z.string().trim().min(1).max(128),
    })
    .strict();

export const veritieJobPersistSchema = z.object({
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
            payload: extractionPayloadSchema,
        })
        .optional(),
    index: evidenceIndexArtifactSchema.optional(),
});

export type CapturesPersistRequest = z.infer<typeof capturesPersistRequestSchema>;
export type ValidatedVeritieJob = z.infer<typeof veritieJobPersistSchema>;
