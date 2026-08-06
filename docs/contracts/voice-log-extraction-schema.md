# Voice log extraction schema (PersonalVoiceCapture)

Structured extraction output for personal voice-log captures. Veritie returns this shape in `job.extraction.payload`. The app maps it into captures, extracted values, timeline events, and aspect lens tags.

## Canonical sources

| Source | Purpose |
| --- | --- |
| Veritie `GET /v1/pipeline/config` | Live schema + glossary (preferred at runtime) |
| [`voice-log-extraction-schema.json`](voice-log-extraction-schema.json) | Checked-in JSON Schema reference |
| [`lib/capture/voice-log-extraction-schema.ts`](../../lib/capture/voice-log-extraction-schema.ts) | Fallback list keys and object-type map |

When Veritie updates the pipeline schema, refresh the JSON file and fallback constants, or rely on `getPipelineConfig()` parsing.

## Entity lists (multi-item)

Each capture may include **zero or many** items per list. Every entity item **must** include `aspect` (enum: `finance`, `fitness`, `work`, `personal`, `admin`). Optional `secondary_aspect` spans a second lens.

| Payload key | App object type | Timeline event |
| --- | --- | --- |
| `tasks` | `task` | `task_detected` |
| `reminders` | `reminder` | `reminder_detected` |
| `goals` | `goal` | `goal_detected` |
| `goal_progress` | `goal_progress` | `goal_progress_detected` |
| `money_entries` | `money_entry` | `expense_detected` |
| `events` | `event` | `event_detected` |
| `records` | `record` | `record_detected` |
| `resources` | `resource` | `resource_detected` |

**Legacy wire key:** some jobs still emit `expenses` instead of `money_entries`. The mapper treats both as money entries.

## Metadata fields (not entity lists)

| Key | Type | Use in app |
| --- | --- | --- |
| `capture_summary` | string | Capture title when present |
| `extraction_warnings` | array | Stored in payload; surfaced in indexed UI as JSON |

## Aspect → capture lens

On persist/enrich, [`lib/capture/extraction-aspect.ts`](../../lib/capture/extraction-aspect.ts) derives `captures.aspect_ids`:

1. Collect `aspect` from every entity in every list.
2. Add `secondary_aspect` when present and distinct.
3. Sort in taxonomy order (`finance` → `fitness` → `work` → `personal` → `admin`).
4. Default to `["personal"]` when no aspects are found.

Captures index filtering uses `aspectIds` via [`lib/aspect-lens`](../../lib/aspect-lens/utils.ts) (`aspectIdsMatchLens`).

## Flat candidate shape

Veritie candidates are **flat objects** (not `{ title, aspect, fields: {…} }`). The mapper:

- Sets `extracted_values.title` from `title`, else `name`, else `description` (money entries).
- Stores remaining properties (e.g. `source_quote`, `due_at`, `amount`) in `extracted_values.fields` jsonb.
- Sets `extracted_values.aspect` from the required `aspect` field (normalized to known enum).

## Required fields (by entity)

See [`voice-log-extraction-schema.json`](voice-log-extraction-schema.json) for per-entity `required` arrays. Common pattern:

- Tasks, goals, events, records, reminders, goal_progress: `title`, `aspect`, `source_quote` (reminders also require `remind_at`, `timing_type`).
- Resources: `name`, `aspect`, `category`, `source_quote`.
- Money entries: `aspect`, `description`, `source_quote`.

## Extracted value IDs

Persisted extracted values use IDs of the form `extracted_{captureId}_{listKey}_{index}` (for example `extracted_capture_abc_tasks_0`). The `listKey` must be registered via pipeline config load or capture-detail payload scan, or match the `capture_*` fallback parser in [`extracted-value-path.ts`](../../lib/capture/extracted-value-path.ts).

## Related code

| Concern | File |
| --- | --- |
| Job → capture bundle | `lib/capture/map-veritie-job.ts` |
| Aspect derivation | `lib/capture/extraction-aspect.ts` |
| Persist validation | `lib/capture/captures-persist-schema.ts` |
| Pipeline config fetch | `components/capture/VeritieCaptureLeaseContext.tsx` |
