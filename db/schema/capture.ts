/**
 * Drizzle schema — captures and voice log pipeline.
 * Target: PostgreSQL on Supabase.
 */
import { sql } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    integer,
    doublePrecision,
    jsonb,
    index,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "./identity";
import { accountIdColumn } from "./tenancy";

export const captures = pgTable(
    "captures",
    {
        id: text("id").primaryKey(),
        accountId: accountIdColumn(),
        type: text("type").notNull(),
        status: text("status").notNull(),
        title: text("title"),
        aspectIds: jsonb("aspect_ids").$type<string[]>().notNull().default([]),
        veritieJobId: text("veritie_job_id"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    },
    (table) => [
        index("captures_account_id_idx").on(table.accountId),
        index("captures_created_at_idx").on(table.createdAt),
        uniqueIndex("captures_account_veritie_job_uidx")
            .on(table.accountId, table.veritieJobId)
            .where(sql`${table.veritieJobId} IS NOT NULL`),
    ],
);

export const veritieJobLeases = pgTable(
    "veritie_job_leases",
    {
        jobId: text("job_id").primaryKey(),
        accountId: accountIdColumn(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    },
    (table) => [
        index("veritie_job_leases_account_id_idx").on(table.accountId),
    ],
);

export const captureSources = pgTable("capture_sources", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    captureId: text("capture_id")
        .notNull()
        .references(() => captures.id),
    kind: text("kind").notNull(),
    uri: text("uri"),
    mimeType: text("mime_type"),
    fileName: text("file_name"),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const voiceLogs = pgTable("voice_logs", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    captureId: text("capture_id")
        .notNull()
        .references(() => captures.id),
    transcriptText: text("transcript_text"),
    language: text("language"),
    durationMs: integer("duration_ms"),
    audioUri: text("audio_uri"),
    indexArtifact: jsonb("index_artifact"),
    extractionPayload: jsonb("extraction_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const transcriptSegments = pgTable(
    "transcript_segments",
    {
        id: text("id").primaryKey(),
        accountId: accountIdColumn(),
        voiceLogId: text("voice_log_id")
            .notNull()
            .references(() => voiceLogs.id),
        index: integer("index").notNull(),
        startMs: integer("start_ms").notNull(),
        endMs: integer("end_ms").notNull(),
        text: text("text").notNull(),
        speakerLabel: text("speaker_label"),
        confidence: doublePrecision("confidence"),
    },
    (table) => [index("transcript_segments_voice_log_idx").on(table.voiceLogId)],
);

export const extractionRuns = pgTable("extraction_runs", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    captureId: text("capture_id")
        .notNull()
        .references(() => captures.id),
    status: text("status").notNull(),
    schemaVersion: text("schema_version"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const extractedValues = pgTable(
    "extracted_values",
    {
        id: text("id").primaryKey(),
        accountId: accountIdColumn(),
        extractionRunId: text("extraction_run_id")
            .notNull()
            .references(() => extractionRuns.id),
        captureId: text("capture_id")
            .notNull()
            .references(() => captures.id),
        objectType: text("object_type").notNull(),
        aspect: text("aspect").notNull(),
        title: text("title").notNull(),
        fields: jsonb("fields").$type<Record<string, unknown>>().notNull().default({}),
        confidence: doublePrecision("confidence").notNull(),
        reviewState: text("review_state").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    },
    (table) => [
        index("extracted_values_capture_idx").on(table.captureId),
        index("extracted_values_review_state_idx").on(table.reviewState),
        index("extracted_values_account_id_idx").on(table.accountId),
    ],
);

export const sourceAnchors = pgTable("source_anchors", {
    id: text("id").primaryKey(),
    accountId: accountIdColumn(),
    extractedValueId: text("extracted_value_id")
        .notNull()
        .references(() => extractedValues.id),
    startMs: integer("start_ms"),
    endMs: integer("end_ms"),
    textStart: integer("text_start"),
    textEnd: integer("text_end"),
    quote: text("quote"),
    segmentIds: jsonb("segment_ids").$type<string[]>(),
    confidence: doublePrecision("confidence"),
});

export const timelineEvents = pgTable(
    "timeline_events",
    {
        id: text("id").primaryKey(),
        accountId: accountIdColumn(),
        type: text("type").notNull(),
        title: text("title").notNull(),
        summary: text("summary"),
        aspect: text("aspect").notNull(),
        occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
        captureId: text("capture_id").references(() => captures.id),
        extractedValueId: text("extracted_value_id").references(
            () => extractedValues.id,
        ),
        extractedObjectType: text("extracted_object_type"),
        reviewState: text("review_state"),
        confidence: doublePrecision("confidence"),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    },
    (table) => [
        index("timeline_events_occurred_at_idx").on(table.occurredAt),
        index("timeline_events_aspect_idx").on(table.aspect),
        index("timeline_events_type_idx").on(table.type),
        index("timeline_events_account_id_idx").on(table.accountId),
    ],
);
