import type { JobDetailResponse } from "@veritie/sdk";

import {
    EXTRACTED_VALUE_SEEDS,
    SOURCE_ANCHOR_SEEDS,
    TRANSCRIPT_SEGMENT_SEEDS,
    VOICE_LOG_SEEDS,
} from "@/lib/stubs/capture-stubs";

const DEMO_JOB_ID = "job_sandbox_morning";
const DEMO_VOICE_LOG_ID = "voice_log_seed_morning";

const morningVoiceLog = VOICE_LOG_SEEDS.find(
    (entry) => entry.id === DEMO_VOICE_LOG_ID,
)!;
const morningSegments = TRANSCRIPT_SEGMENT_SEEDS.filter(
    (segment) => segment.voiceLogId === DEMO_VOICE_LOG_ID,
);
const morningExtracted = EXTRACTED_VALUE_SEEDS.filter(
    (value) => value.captureId === "capture_seed_morning_log",
);

function completedRuntime(): JobDetailResponse["runtime"] {
    return {
        overall: "completed",
        session_lease: {
            status: "consumed",
            attempt_count: 1,
            lease_version: "v0",
            ingest_mode: "live_first",
        },
        ingest: { status: "completed", attempt_count: 1 },
        transcript: { status: "completed", attempt_count: 1 },
        extraction: { status: "completed", attempt_count: 1 },
        source_audio: {
            status: "completed",
            attempt_count: 1,
            canonical_audio_state: "completed",
            integrity_state: "not_applicable",
        },
        indexing: { status: "completed", attempt_count: 1 },
        sink_deliveries: {
            status: "skipped",
            attempt_count: 0,
            skip_reason: "not_configured",
            failure_policy: "non_blocking",
        },
    } as JobDetailResponse["runtime"];
}

function runningRuntime(
    extraction: JobDetailResponse["runtime"]["extraction"],
    indexing: JobDetailResponse["runtime"]["indexing"],
): JobDetailResponse["runtime"] {
    return {
        overall: "extracting",
        session_lease: {
            status: "consumed",
            attempt_count: 1,
            lease_version: "v0",
            ingest_mode: "live_first",
        },
        ingest: { status: "completed", attempt_count: 1 },
        transcript: { status: "completed", attempt_count: 1 },
        extraction,
        source_audio: {
            status: "completed",
            attempt_count: 1,
            canonical_audio_state: "completed",
            integrity_state: "not_applicable",
        },
        indexing,
        sink_deliveries: {
            status: "skipped",
            attempt_count: 0,
            skip_reason: "not_configured",
            failure_policy: "non_blocking",
        },
    } as JobDetailResponse["runtime"];
}

function transcriptSegments() {
    return morningSegments.map((segment) => ({
        index: segment.index,
        start_ms: segment.startMs,
        end_ms: segment.endMs,
        text: segment.text,
        confidence: segment.confidence,
    }));
}

function extractionPayload() {
    const tasks = morningExtracted
        .filter((value) => value.objectType === "task")
        .map((value) => ({
            aspect: value.aspect,
            title: value.title,
            confidence: value.confidence,
            fields: value.fields,
        }));
    const reminders = morningExtracted
        .filter((value) => value.objectType === "reminder")
        .map((value) => ({
            aspect: value.aspect,
            title: value.title,
            confidence: value.confidence,
            fields: value.fields,
        }));
    const expenses = morningExtracted
        .filter((value) => value.objectType === "money_entry")
        .map((value) => ({
            aspect: value.aspect,
            title: value.title,
            confidence: value.confidence,
            fields: value.fields,
        }));

    return { tasks, reminders, expenses };
}

function indexEntries() {
    const taskAnchor = SOURCE_ANCHOR_SEEDS.find(
        (anchor) => anchor.extractedValueId === "extracted_task_medibank",
    );
    const expenseAnchor = SOURCE_ANCHOR_SEEDS.find(
        (anchor) => anchor.extractedValueId === "extracted_expense_chemist",
    );

    return [
        {
            path: "/tasks/0/title",
            status: "matched" as const,
            quote: taskAnchor?.quote,
            segment_ids: ["segment-0"],
            start_ms: taskAnchor?.startMs ?? 0,
            end_ms: taskAnchor?.endMs ?? 14000,
            match_method: "exact" as const,
            confidence: taskAnchor?.confidence ?? 0.86,
        },
        {
            path: "/expenses/0/title",
            status: "matched" as const,
            quote: expenseAnchor?.quote,
            segment_ids: ["segment-1"],
            start_ms: expenseAnchor?.startMs ?? 14000,
            end_ms: expenseAnchor?.endMs ?? 28000,
            match_method: "exact" as const,
            confidence: expenseAnchor?.confidence ?? 0.91,
        },
        {
            path: "/reminders/0/title",
            status: "matched" as const,
            quote: "Remind me next Friday to renew the car rego.",
            segment_ids: ["segment-2"],
            start_ms: 28000,
            end_ms: 42000,
            match_method: "fuzzy" as const,
            confidence: 0.84,
        },
    ];
}

function baseJob(
    overrides: Partial<JobDetailResponse> = {},
): JobDetailResponse {
    return {
        job_id: DEMO_JOB_ID,
        status: "running",
        accepted_request: { audio_content_type: "audio/webm" },
        events: [],
        runtime: runningRuntime(
            { status: "pending", attempt_count: 0 },
            { status: "pending", attempt_count: 0 },
        ),
        ingest_mode: "live_first",
        canonical_audio_state: "completed",
        integrity_state: "not_applicable",
        transcript_state: "pending",
        extraction_state: "pending",
        tool_suggestion_state: "skipped",
        indexing_state: "pending",
        background_processing: true,
        transcript_ready: false,
        audio_persisted: true,
        ...overrides,
    };
}

/** Job snapshot used when transcript text is available but enrichment is still pending. */
export function buildVoiceCaptureStubTranscriptJob(): JobDetailResponse {
    return baseJob({
        status: "running",
        transcript_state: "completed",
        transcript_ready: true,
        transcript: {
            text: morningVoiceLog.transcriptText ?? "",
            language: morningVoiceLog.language,
            duration_ms: morningVoiceLog.durationMs,
            segments: transcriptSegments(),
        },
        runtime: runningRuntime(
            { status: "running", attempt_count: 1 },
            { status: "pending", attempt_count: 0 },
        ),
        extraction_state: "running",
        indexing_state: "pending",
    });
}

/** Job snapshot with extraction payload but evidence index still building. */
export function buildVoiceCaptureStubExtractionJob(): JobDetailResponse {
    return baseJob({
        status: "running",
        transcript_state: "completed",
        extraction_state: "completed",
        indexing_state: "running",
        transcript_ready: true,
        transcript: {
            text: morningVoiceLog.transcriptText ?? "",
            language: morningVoiceLog.language,
            duration_ms: morningVoiceLog.durationMs,
            segments: transcriptSegments(),
        },
        extraction: {
            payload: extractionPayload(),
        },
        runtime: runningRuntime(
            { status: "completed", attempt_count: 1 },
            { status: "running", attempt_count: 1 },
        ),
    });
}

/** Fully enriched job snapshot with transcript, extraction, and evidence index. */
export function buildVoiceCaptureStubCompleteJob(): JobDetailResponse {
    return baseJob({
        status: "completed",
        transcript_state: "completed",
        extraction_state: "completed",
        indexing_state: "completed",
        background_processing: false,
        transcript_ready: true,
        transcript: {
            text: morningVoiceLog.transcriptText ?? "",
            language: morningVoiceLog.language,
            duration_ms: morningVoiceLog.durationMs,
            segments: transcriptSegments(),
        },
        extraction: {
            payload: extractionPayload(),
        },
        index: {
            status: "completed",
            builder_version: "v1",
            entries: indexEntries(),
        },
        runtime: completedRuntime(),
    });
}

export const VOICE_CAPTURE_SANDBOX_AUDIO_URL = morningVoiceLog.audioUri;

export const VOICE_CAPTURE_SANDBOX_TRANSCRIPT = morningVoiceLog.transcriptText;
