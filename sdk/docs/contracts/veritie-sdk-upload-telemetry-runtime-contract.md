# Contract: Veritie SDK Upload Telemetry Runtime Contract

## Purpose

Define the client-authored upload telemetry produced by the SDK signed-upload path and the additive finalize payload fields that later server observability work may consume.

## Scope

Included:

-   `uploadToSignedUrl(...)` return shape
-   upload telemetry field semantics
-   finalize payload compatibility rules
-   timestamp encoding and duration rules

Out of scope:

-   server persistence or observability implementation
-   storage provider internals
-   historical upload analytics

## Versioning

-   **Current version:** v1
-   **Compatibility:** Backward compatible additive finalize fields
-   **Change policy:** Major bump for field rename/semantic change; minor bump for additive telemetry fields

## Definitions

-   `upload instruction` — server-issued signed upload target returned by bootstrap
-   `upload acknowledgement` — successful completion of the SDK upload request
-   `client upload duration` — elapsed local time from immediately before upload starts until acknowledgement is received

## Contract Shape (Conceptual)

### Required fields

-   `upload_ack_received_at` — RFC3339 timestamp captured by the SDK when upload acknowledgement is received
-   `client_upload_duration_ms` — integer milliseconds for the successful upload duration
-   `file_size_bytes` — integer uploaded byte count from the `Blob`

### Optional fields

-   `upload_instruction_issued_at` — RFC3339 server-issued timestamp forwarded only when the upload target/bootstrap context already contains a trustworthy issued-at value

## Invariants (Must Always Hold)

-   The SDK must not invent `upload_instruction_issued_at` when the bootstrap response does not contain a trustworthy server-issued value.
-   `upload_ack_received_at`, `client_upload_duration_ms`, and `file_size_bytes` only describe successful upload completion.
-   `client_upload_duration_ms` is measured from immediately before the upload request begins until the acknowledgement resolves.
-   `finalizeUpload(jobId, { audio_uri })` remains valid during the additive-telemetry transition.
-   `createAndUploadJob(...)` forwards the returned upload telemetry into finalize automatically.

## Error Handling

-   Failed uploads reject before finalize and do not produce a truthful completed-upload telemetry payload.
-   Content-type mismatch rejects before any upload request is sent.
-   Upload request failures may include SDK-local diagnostic details, but incomplete upload telemetry must not be forwarded as if the upload succeeded.

## Examples

### Minimal valid example

```ts
const upload = await client.uploadToSignedUrl(bootstrap.upload, file, {
    contentType: file.type,
});

await client.finalizeUpload(bootstrap.job_id, {
    audio_uri: bootstrap.upload.audio_uri,
    ...upload.telemetry,
});
```

### Invalid example

```ts
await client.finalizeUpload(bootstrap.job_id, {
    audio_uri: bootstrap.upload.audio_uri,
    upload_instruction_issued_at: new Date().toISOString(),
});
```

Expected handling:

-   caller behavior is semantically invalid unless that timestamp came from a trustworthy bootstrap/upload target
-   SDK docs treat this field as forward-only from bootstrap context, not caller-fabricated metadata

### Operational notes

-   Timestamp encoding is RFC3339/ISO UTC string form.
-   Telemetry is explicit rather than hidden inside SDK instance state.
-   Server acceptance and persistence of these fields may lag SDK support during the current rollout window.

### References

-   Related ADRs: `sdk/docs/adr/ADR-0001-veritie-sdk-http-sse-and-react-surface.md`
-   Issue/PR: #
