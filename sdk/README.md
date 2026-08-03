# Veritie SDK

TypeScript SDK for the current Veritie server runtime.

This package is server-contract-first and currently supports both prerecord batch flows and live websocket session flows:

- `POST /v1/jobs` bootstrap
- signed upload via the returned `upload` target
- `POST /v1/jobs/{job_id}/upload-finalize`
- `GET /v1/jobs/{job_id}`
- `POST /v1/jobs/{job_id}/rerun`
- `GET /v1/jobs/{job_id}/stream` over authenticated SSE
- live websocket bootstrap via `stream_ingest`
- websocket live session open/chunk/end helpers

The current MVP runtime is transcript-first and background-safe:

- uploaded audio remains the canonical durable source artifact
- Veritie retained audio is an internal processing/provenance artifact, not an integrator-facing media hosting surface
- transcript readiness is the first meaningful user-facing milestone
- later extraction, evidence indexing, and tool suggestion can complete after the initial UI session ends
- SSE remains a progress/recovery transport; durable job reads remain the correctness path
- `getJob(...)` may return an optional `index` artifact alongside `extraction`; legacy jobs and in-flight jobs may omit it
- pipeline handles auto-refresh canonical job detail after artifact-ready SSE events, including `indexing_completed` and `indexing_failed`
- live websocket is the primary active-session transport when live capability is available

The package still reflects the current low-level transport surface. Proposal-backed future work may add higher-level lifecycle helpers such as lease preparation, pipeline handles, SDK-managed microphone capture, and normalized runtime-mode presets.

For current repo-level MVP context, start with [`docs/00-current-mvp-overview.md`](../docs/00-current-mvp-overview.md).

## Install

```bash
npm install @veritie/sdk
```

React consumers must also provide compatible `react` and `react-dom` peer dependencies.

## Basic Usage

```ts
import { VeritieSDK } from "@veritie/sdk";

const client = new VeritieSDK({
    baseUrl: "http://localhost:8080",
    pipelineAlias: "local-dev-pipeline",
    apiKey: "vt_dev_local_13c_seed_key",
});

const bootstrap = await client.createJob(
    {
        audio_content_type: "audio/wav",
        audio_size_bytes: file.size,
        metadata: { locale: "en-AU" },
    },
    { idempotencyKey: "job-001" },
);

const upload = await client.uploadToSignedUrl(bootstrap.upload, file);

const job = await client.finalizeUpload(bootstrap.job_id, {
    audio_uri: bootstrap.upload.audio_uri,
    ...upload.telemetry,
});
```

## Integrator Audio Ownership

If your product needs browser playback, sharing, editing, long-term media access, or its own CSP/CDN behavior, store your own playback copy in your app's storage before or alongside Veritie ingest. Use Veritie for processing and link the returned `job_id` to your media record.

The SDK upload target writes audio into Veritie's private processing storage. The returned `audio_uri` is an internal Veritie reference and is not a playback URL.

## Upload Telemetry Contract

`uploadToSignedUrl(...)` returns explicit upload telemetry for later finalize calls:

- `upload_instruction_issued_at`
  - optional RFC3339 timestamp from the bootstrap/upload target
  - only present when the server includes a trustworthy issued-at value
- `upload_ack_received_at`
  - RFC3339 timestamp captured by the SDK when the upload acknowledgement is received
- `client_upload_duration_ms`
  - integer milliseconds measured by the SDK from immediately before upload begins until acknowledgement
- `file_size_bytes`
  - integer byte size taken from the uploaded `Blob`

Current compatibility posture:

- `finalizeUpload(jobId, { audio_uri })` remains valid
- callers that want telemetry should spread `upload.telemetry` into the finalize payload
- server persistence and observability of these fields are deferred to the later server observability branch

## Streaming Progress

```ts
const stream = await client.streamJob(job.job_id, {
    onEvent(event) {
        console.log(event.event, event.data);
    },
});

await stream.completed;
```

Handled SSE behavior:

- stream open failures are fatal
- caller aborts are treated as expected shutdown
- post-open disconnects are only treated as non-fatal when the SDK has already seen valid stream activity and the failure matches the known recoverable network-error class
- real stream failures still reject `completed` and flow through `onError`

## React Hook

```tsx
import { useMemo } from "react";
import { useVeritie } from "@veritie/sdk";

function JobViewer() {
    const config = useMemo(
        () => ({
            baseUrl: "http://localhost:8080",
            pipelineAlias: "local-dev-pipeline",
            apiKey: "vt_dev_local_13c_seed_key",
        }),
        [],
    );

    const veritie = useVeritie({
        config,
    });

    return <pre>{JSON.stringify(veritie.latestSnapshot, null, 2)}</pre>;
}
```

Veritie is the only public SDK surface in this package.
