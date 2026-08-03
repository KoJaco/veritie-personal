# Decision Note: SDK Transport Hardening and Upload Telemetry Defaults

## Date

2026-03-31

## Summary

The SDK now treats upload telemetry as explicit client-authored metadata and hardens SSE behavior around caller-owned failures, recoverable post-open disconnects, and cleanup safety. This note records the current operational defaults so later server observability work and frontend consumers build on the same assumptions.

## Decision

The SDK defaults are:

-   `uploadToSignedUrl(...)` returns explicit telemetry
-   `finalizeUpload(...)` accepts additive optional telemetry fields while preserving legacy `{ audio_uri }`
-   `createAndUploadJob(...)` auto-forwards upload telemetry into finalize
-   open failures and non-recoverable read failures remain fatal
-   recoverable post-open network disconnects are only suppressed under the explicitly-defined stream rules
-   cleanup paths must not leak unhandled promise rejections

## Rationale

-   Explicit telemetry is easier to reason about than hidden SDK instance state.
-   Additive finalize compatibility avoids breaking current callers while server observability catches up.
-   Conservative stream failure handling preserves transport correctness.
-   Promise cleanup safety matters because browser consumers will otherwise surface noisy duplicate `unhandledRejection` errors.

## Impact

-   Affects `VeritieSDK`, `useVeritie`, upload/finalize examples, and stream failure diagnostics.
-   Gives later server branches a stable client-side telemetry contract.
-   Reduces UI fragility around recoverable transport disconnects and detached cleanup promises.

## Follow-ups

-   [ ] Persist and expose finalize upload telemetry on the server side.
-   [ ] Revisit whether the SDK should expose more explicit stream terminal metadata than `completed`, `lastEventId`, and caller-managed `getJob(...)`.

## References

-   Issue: #
-   PR: #
-   Related ADR/Contracts: `sdk/docs/adr/ADR-0001-veritie-sdk-http-sse-and-react-surface.md`, `sdk/docs/contracts/veritie-sdk-runtime-contract.md`, `sdk/docs/contracts/veritie-sdk-stream-runtime-contract.md`, `sdk/docs/contracts/veritie-sdk-upload-telemetry-runtime-contract.md`
