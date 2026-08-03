# ADR-0001: Veritie SDK HTTP, SSE, and React Surface

## Status

Accepted

## Date

2026-03-31

## Context

The Veritie SDK is no longer the legacy websocket/audio-capture client, but it is also no longer accurate to describe the runtime as HTTP + SSE only. The current product runtime depends on authenticated HTTP requests for job bootstrap/finalize/read paths, authenticated SSE for progress streaming and recovery, and additive live websocket support for active live ingest sessions. The SDK also needs one consistent browser-consumable React surface without splitting the package into multiple publish targets immediately.

Branches 15, 16, 17, and the current SDK transport-hardening work established the remaining decisions that need to be explicit: the root public API, the transport model, the stream lifecycle semantics, and how upload telemetry is surfaced for later server observability work.

## Decision

The SDK adopts the following:

1. `VeritieSDK` is the canonical root client export.
2. `useVeritie` is the only public React hook export and ships from the same package root.
3. The SDK runtime is HTTP + authenticated fetch-SSE plus additive websocket live-session support.
4. Protected server-bound requests require a default `pipelineAlias` at client construction and may accept a per-call override when a caller intentionally targets another pipeline.
5. Upload telemetry is exposed explicitly from `uploadToSignedUrl(...)` and may be forwarded additively into `finalizeUpload(...)`.
6. SSE failures remain caller-owned, but cleanup paths must never leak unhandled promise rejections.

## Alternatives Considered

-   **Split React into a second package** — rejected because the current SDK is still small, tightly coupled to the same typed contracts, and easier to reason about as one package root.
-   **Hide upload telemetry inside SDK instance state** — rejected because it makes finalize behavior less explicit and complicates correctness for callers that do not use one linear helper flow.
-   **Use `EventSource` for SSE** — rejected because authenticated custom headers must work in both browser and Node test environments.
-   **Require pipeline alias on every call with no client default** — rejected because it weakens ergonomics without improving transport correctness.
-   **Treat any post-open stream disconnect as harmless** — rejected because that would hide genuine transport failures and weaken stream correctness.

## Consequences

-   **Pros**
-   One package root owns the full public Veritie SDK surface.
-   Transport behavior is explicit and aligned to the current server runtime.
-   Pipeline targeting stays centralized and uniform across HTTP and SSE.
-   Live websocket support can remain first-class without reintroducing the old legacy client model.
-   Upload telemetry is available without making finalize behavior magical.
-   React consumers and imperative consumers share the same core transport semantics.

-   **Cons**
-   Browser consumers must still understand the batch upload/finalize flow.
-   SSE correctness depends on both client and server transport behavior, not SDK code alone.
-   The current single-package shape remains transitional even though it is acceptable for MVP.
-   Additive finalize telemetry means there is a temporary compatibility window where some callers send telemetry and some do not.

-   **Follow-ups / TODOs** (optional)
-   Add server-side persistence and observability for the finalize telemetry fields.
-   Revisit whether stream lifecycle metadata should surface more explicitly than the current error and snapshot model.

## References

-   Issue: #
-   PR: #
-   Related docs/contracts: `sdk/docs/contracts/veritie-sdk-runtime-contract.md`, `sdk/docs/contracts/veritie-sdk-stream-runtime-contract.md`, `sdk/docs/contracts/veritie-sdk-upload-telemetry-runtime-contract.md`
