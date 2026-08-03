# Contract: Veritie SDK Stream Runtime Contract

## Purpose

Define the client-side SSE subscription behavior exposed by `VeritieSDK.streamJob(...)` and `useVeritie().subscribeToJob(...)`.

## Scope

Included:

-   authenticated stream open behavior
-   subscription object semantics
-   replay/event/snapshot handling
-   disconnect classification
-   cleanup and error ownership
-   additive live-event names carried over the existing SSE subscription surface

Out of scope:

-   server-side SSE implementation details
-   non-SSE streaming transports
-   canonical job-detail payload semantics outside stream state

## Versioning

-   **Current version:** v1
-   **Compatibility:** Backward compatible within current SSE lifecycle semantics
-   **Change policy:** Major bump for subscription contract or failure-classification changes; minor bump for additive event payload fields

## Definitions

-   `open failure` — failure before an SSE response body is successfully established
-   `read failure` — failure after the SSE response body is open and the SDK is reading chunks
-   `recoverable disconnect` — known post-open network error after valid stream activity has already been seen
-   `terminal stream completion` — completion after a terminal lifecycle event or terminal snapshot state

## Contract Shape (Conceptual)

### Required fields

-   `completed` — promise that resolves on handled completion and rejects on genuine stream failure
-   `closed` — boolean closed state
-   `close()` — caller-owned shutdown path

### Optional fields

-   `lastEventId` — most recent replay/live-tail cursor seen from the server
-   `onOpen` — callback invoked after stream response body availability is confirmed
-   `onEvent` — callback invoked for lifecycle and `job.snapshot` events
-   `onError` — callback invoked only for failures the SDK treats as genuine errors
-   `job.snapshot.transcript_state` / `extraction_state` / `tool_suggestion_state` — additive reconnect-safe processing state
-   `job.snapshot.background_processing` — whether enrichment is still active after transcript readiness
-   `job.snapshot.transcript_ready` — transcript-first success indicator on reconnect

## Invariants (Must Always Hold)

-   Open failures are fatal and reject `completed`.
-   Caller aborts via `close()` are treated as expected shutdown.
-   Post-open disconnects are only treated as handled when valid stream activity already occurred and the thrown error matches the known recoverable network-error class.
-   Non-recoverable read failures reject `completed` and flow through `onError`.
-   SDK and hook cleanup paths must not leak unhandled promise rejections.
-   `lastEventId` tracks the latest replay/live-tail cursor seen in the stream.
-   Snapshot payloads may indicate transcript-ready progress before terminal lifecycle completion.
-   Dotted live event names such as `processing.started` and `stream.interrupted` are additive and do not replace existing underscore lifecycle event names.

## Error Handling

-   `stream_open_failed` for fetch/open failures or non-OK stream responses
-   `stream_body_missing` when the stream response lacks a body
-   `stream_read_failed` for non-recoverable post-open read failures
-   recoverable post-open network disconnects are logged/debuggable in development but do not invoke `onError`

## Examples

### Minimal valid example

```ts
const stream = await client.streamJob(jobId, {
    onEvent(event) {
        console.log(event.event, event.data);
    },
});

await stream.completed;
```

### Invalid example

```ts
const stream = await client.streamJob(jobId);
await stream.completed; // stream open returns non-200
```

Expected handling:

-   reject with `VeritieSDKError`
-   error code `stream_open_failed`

### Operational notes

-   The SDK includes development debug logs around stream open/read failures and normalization paths.
-   Canonical recovery after stream trouble remains `getJob(jobId)`.
-   Hook consumers should treat streamed state as assistive, not authoritative.
-   Transcript-first UIs should use snapshot plus `getJob(jobId)` to show transcript readiness without depending on the stream remaining open.
-   `transcript.partial` is part of the public event union in `07c`, but callers must tolerate its absence until later runtime work emits partial transcript events.

### References

-   Related ADRs: `sdk/docs/adr/ADR-0001-veritie-sdk-http-sse-and-react-surface.md`
-   Issue/PR: #
