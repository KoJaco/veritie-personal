# Contract: Veritie SDK Runtime Contract

## Purpose

Define the public package-root SDK surface consumed by frontend/browser code, tests, and any external Veritie SDK consumers.

## Scope

Included:

-   root public exports
-   imperative client methods
-   React hook methods and state
-   request/response typing expectations
-   additive finalize upload telemetry support

Out of scope:

-   server route internals
-   frontend application-specific UI contracts
-   integrator-facing audio hosting, playback URLs, or signed download helpers
-   internal module boundaries below the package root

## Versioning

-   **Current version:** v1
-   **Compatibility:** Backward compatible within the current batch plus live-session surface
-   **Change policy:** Major bump for root export or method-shape breaks; minor bump for additive request/response fields

## Definitions

-   `imperative client` — `VeritieSDK`
-   `hook surface` — `useVeritie`
-   `subscription` — caller-owned object returned by `streamJob(...)` / `subscribeToJob(...)`
-   `upload telemetry` — SDK-authored client-side metadata returned by `uploadToSignedUrl(...)`
-   `pipeline handle` — proposal-backed future higher-level lifecycle/state surface that may coexist with current low-level APIs

## Contract Shape (Conceptual)

### Required fields

-   `VeritieSDK` — root client class for job/bootstrap/upload/finalize/read/rerun/stream flows
-   `useVeritie` — root React hook for the same transport contract plus connection state
-   `VeritieClientConfig.pipelineAlias` — required default pipeline alias for protected server requests
-   `createJob(request)` — create an `awaiting_upload` job and receive an upload target
-   `uploadToSignedUrl(upload, body, options)` — upload bytes to the signed target and return upload telemetry
-   `finalizeUpload(jobId, request)` — finalize the uploaded object and queue the job
-   `getJob(jobId)` — fetch canonical job detail
-   `getPipelineConfig(options?)` — fetch the current pipeline display bundle for integrator UI rendering
-   `streamJob(jobId, options)` / `subscribeToJob(jobId, options)` — open authenticated SSE job progress streams
-   `openLiveSession(bootstrap, options)` — open a websocket live-ingest session from bootstrap metadata
-   `streamLiveFile(bootstrap, file, options)` — stream a prerecorded file through the live websocket path
-   `createAndStreamJob(options)` — convenience create + live stream helper with pre-start batch fallback

### Optional fields

-   per-call `pipelineAlias` override on server-bound HTTP/SSE methods and helper options
-   `FinalizeUploadRequest.upload_instruction_issued_at` — optional server-issued RFC3339 timestamp when available from bootstrap context
-   `FinalizeUploadRequest.upload_ack_received_at` — optional SDK-captured RFC3339 timestamp for successful upload acknowledgement
-   `FinalizeUploadRequest.client_upload_duration_ms` — optional integer upload duration in milliseconds
-   `FinalizeUploadRequest.file_size_bytes` — optional integer uploaded byte count
-   `JobDetailResponse.transcript_state` — additive transcript processing state (`pending | running | completed | failed`)
-   `JobDetailResponse.extraction_state` — additive extraction processing state (`pending | running | completed | failed`)
-   `JobDetailResponse.tool_suggestion_state` — additive tool suggestion processing state (`pending | running | completed | failed | skipped`)
-   `JobDetailResponse.indexing_state` — additive indexing processing state (`pending | running | completed | failed | skipped`)
-   `JobDetailResponse.index` — optional extraction evidence index artifact; absent before indexing starts, on legacy jobs, and when indexing is skipped
-   `EvidenceIndexArtifact`, `EvidenceIndexEntry`, and related exported types — canonical evidence-index wire shape from `getJob(...)`
-   `PipelineDisplayConfigV1` and related exported types — display bundle wire shape from `getPipelineConfig(...)`
-   `indexing_started`, `indexing_completed`, and `indexing_failed` — additive SSE lifecycle events; payloads carry no index body
-   `JOB_DETAIL_REFRESH_EVENTS`, `isJobDetailRefreshEvent(...)`, `jobDetailRefreshKey(...)`, and `hasPendingJobEnrichment(...)` — shared helpers for canonical-detail refresh and enrichment polling
-   `JobDetailResponse.background_processing` — whether transcript is ready while enrichment is still active
-   `JobDetailResponse.transcript_ready` — explicit transcript-first success milestone
-   `TranscriptSegment.speaker_label` — optional diarization label when the pipeline enables multiple speakers
-   `JobDetailResponse.audio_persisted` — additive milestone; `true` once source audio is verified and durable (batch: after upload finalize; live: after canonical audio verification)
-   `PipelineHandle.submitAndDetach(file)` — background preset helper: batch upload + finalize, resolves when `audio_persisted` without opening SSE
-   `RuntimePreset` — documented preset names (`background`, `observable`, `review`, `debug`); `background` forces batch upload and detach-at-audio-persisted
-   `BootstrapJobResponse.stream_ingest` — additive live bootstrap block when live transport is available
-   `connectionStatus`, `error`, `events`, `latestSnapshot` — hook-managed stream state
-   attempt counters and richer layered runtime state remain proposal-backed additive fields rather than current required output
-   package split toward `@veritie/sdk`, `@veritie/react`, and `@veritie/ui-react` remains target-direction rather than current required structure

## Invariants (Must Always Hold)

-   The package root exports `VeritieSDK`, `useVeritie`, `VeritieSDKError`, and public types.
-   Integrators authenticate with one API key and select the runtime pipeline via `pipelineAlias` / `X-Veritie-Pipeline`. There is no per-pipeline API key model.
-   Protected server-bound requests always send `X-Veritie-Pipeline`, using the per-call override when present and the client config otherwise.
-   `uploadToSignedUrl(...)` returns explicit upload telemetry rather than mutating hidden finalize state.
-   `finalizeUpload(jobId, { audio_uri })` remains valid during the current additive-telemetry window.
-   `audio_uri` is an internal Veritie storage reference. SDK consumers must not treat it as a browser playback URL.
-   Hook methods delegate to the same core client behavior rather than reimplementing transport logic.
-   Canonical job truth remains `getJob(...)`, not in-memory stream state.
-   `getPipelineConfig(...)` returns current active pipeline config at read time and may differ from an older job's frozen snapshot.
-   Display bundle responses intentionally exclude execution-only assets such as processing config, LLM config, extraction guidance, toolset definitions, and sink secrets.
-   SSE indexing lifecycle events are invalidation signals only; pipeline handles auto-refresh canonical detail on artifact-ready lifecycle events and relevant snapshots with event-key deduplication.
-   Indexing failure on `partial_success` is product degradation reported through job detail and runtime state, not a transport or stream failure.
-   Malformed evidence-index wire data from `getJob(...)` rejects with `VeritieSDKError` code `invalid_evidence_index`; unknown future entry status or match-method strings are preserved when safe.
-   Transcript readiness may be the first meaningful success state before terminal completion.
-   The current SDK exposes live websocket behavior and may later own microphone capture by default while still preserving host-managed chunk/blob escape hatches.
-   `createAndStreamJob(...)` only falls back to batch before live streaming starts. After live streaming has started, failures surface as live transport errors rather than silent batch fallback.
-   Live websocket is a first-class MVP transport for active live sessions; SSE remains valuable for replay/recovery and batch progress.

## Error Handling

-   HTTP and thrown transport errors normalize to `VeritieSDKError`.
-   Hook consumers receive normalized stream failures through `error` and `connectionStatus: "error"`.
-   Cleanup paths must not leak unhandled promise rejections.
-   Callers retain ownership of `subscription.completed` failures.

## Examples

### Minimal valid example

```ts
const client = new VeritieSDK({
    baseUrl: "http://localhost:8080",
    pipelineAlias: "field-service-au",
    apiKey: "vt_dev_local_key",
});

const bootstrap = await client.createJob({
    audio_content_type: "audio/wav",
});

// Store `file` in your own product storage here as well if your app needs
// browser playback or long-term user-facing media access.
const upload = await client.uploadToSignedUrl(bootstrap.upload, file);

await client.finalizeUpload(bootstrap.job_id, {
    audio_uri: bootstrap.upload.audio_uri,
    ...upload.telemetry,
});
```

### Invalid example

```ts
await client.uploadToSignedUrl(
    {
        method: "PUT",
        url: "https://upload.example.test/put",
        audio_uri: "supabase://audio/jobs/job-1/source",
        required_mime_type: "audio/wav",
    },
    new Blob(["audio"], { type: "audio/mpeg" }),
);
```

Expected handling:

-   reject with `VeritieSDKError`
-   error code `content_type_mismatch`

### Operational notes

-   The SDK supports both `Authorization: Bearer` and `X-API-Key`.
-   `X-Veritie-Pipeline` is centralized in SDK auth/header assembly rather than left to caller-managed ad hoc headers.
-   The package builds to both ESM and CJS.
-   `createAndUploadJob(...)` is the convenience path that automatically forwards upload telemetry into finalize.
-   Integrators that need browser audio playback should serve that media from their own storage/CDN and associate their media record with the Veritie `job_id`.
-   `stream_ingest.websocket_url` is treated as authoritative websocket auth state; the SDK does not add API headers to browser websocket upgrades.
-   Transcript-first consumers should prefer `getJob(jobId)` for durable recovery and treat SSE as assistive live progress.
-   Integrator UI bootstrapping should prefer `getPipelineConfig()` for schema/glossary/settings display before job creation.
-   Future lifecycle APIs may expose preparation, normalized state, fixed runtime preset names (`background`, `observable`, `review`, `debug`), and action/error contracts without invalidating the current low-level transport surface.
-   The `background` runtime preset is available via upload handles + `submitAndDetach(...)`: force `batch_only` transport and treat `audio_persisted` (upload finalize success) as the detach point. Callers may optionally poll `getJob(...)` / `hasPendingJobEnrichment(...)` afterward.

### References

-   Related server contract: `server/docs/contracts/http-pipeline-config-runtime-contract.md`
-   Related ADRs: `sdk/docs/adr/ADR-0001-veritie-sdk-http-sse-and-react-surface.md`
-   Issue/PR: #
