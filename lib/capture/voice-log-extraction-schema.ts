import type { ExtractedObjectType } from "@/lib/domain/extraction";

/**
 * Entity list keys from PersonalVoiceCapture extraction schema.
 * Paste updates from Veritie `GET /v1/pipeline/config` or
 * `docs/contracts/voice-log-extraction-schema.json` when the backend changes.
 */
export const VOICE_LOG_EXTRACTION_LIST_KEYS = [
    "tasks",
    "reminders",
    "goals",
    "goal_progress",
    "money_entries",
    "events",
    "records",
    "resources",
] as const;

export type VoiceLogExtractionListKey =
    typeof VOICE_LOG_EXTRACTION_LIST_KEYS[number];

/** Top-level payload keys that are not entity lists. */
export const VOICE_LOG_EXTRACTION_METADATA_KEYS = [
    "capture_summary",
    "extraction_warnings",
] as const;

/**
 * Wire-format aliases for entity lists (legacy keys still seen in jobs).
 * `money_entries` is canonical; some pipelines still emit `expenses`.
 */
export const EXTRACTION_LIST_KEY_ALIASES: Partial<
    Record<VoiceLogExtractionListKey, readonly string[]>
> = {
    money_entries: ["money_entries", "expenses"],
};

export const VOICE_LOG_EXTRACTION_OBJECT_TYPES: Record<
    VoiceLogExtractionListKey,
    ExtractedObjectType
> = {
    tasks: "task",
    reminders: "reminder",
    goals: "goal",
    goal_progress: "goal_progress",
    money_entries: "money_entry",
    events: "event",
    records: "record",
    resources: "resource",
};

export const VOICE_LOG_EXTRACTION_EVENT_TYPES: Record<
    VoiceLogExtractionListKey,
    string
> = {
    tasks: "task_detected",
    reminders: "reminder_detected",
    goals: "goal_detected",
    goal_progress: "goal_progress_detected",
    money_entries: "expense_detected",
    events: "event_detected",
    records: "record_detected",
    resources: "resource_detected",
};

/** Minimal schema definition stub for offline/tests when pipeline config fetch fails. */
export const DEFAULT_VOICE_LOG_SCHEMA_DEFINITION = {
    entities: VOICE_LOG_EXTRACTION_LIST_KEYS.map((key) => ({
        key,
        collection_key: key,
        object_type: VOICE_LOG_EXTRACTION_OBJECT_TYPES[key],
    })),
};

/** Minimal glossary stub for offline/tests. */
export const DEFAULT_VOICE_LOG_GLOSSARY_DEFINITION = {
    entries: VOICE_LOG_EXTRACTION_LIST_KEYS.map((key) => ({
        key,
        label: key.replace(/_/g, " "),
    })),
};
