# Architecture — Veritie SDK Runtime Boundary

## Purpose

Describe the current SDK architecture, its stable responsibility boundaries, and how the imperative client, React hook, and transport layers compose into one public Veritie-first package.

## Scope

Covered:

-   package-root public exports
-   core client orchestration
-   auth/header preparation
-   HTTP request transport
-   websocket live-session transport
-   fetch-based SSE transport
-   React hook state ownership
-   upload telemetry propagation

Not covered:

-   server-side route implementation
-   worker/runtime pipeline execution
-   frontend application UI state beyond the generic hook consumer model
-   future final package split beyond the current single published package

## Components

-   `VeritieSDK`
    - owns the imperative job-oriented API
    - composes HTTP, websocket live transport, and SSE transports
    - exposes lifecycle-safe stream subscriptions
-   `useVeritie`
    - owns React subscription state, error state, and connection status
    - delegates transport work to `VeritieSDK`
-   `auth.ts`
    - resolves auth/header configuration for both HTTP and SSE requests
    - applies the default `pipelineAlias` or per-call override to `X-Veritie-Pipeline`
-   `transport/http.ts`
    - handles JSON request/response transport and upload requests
-   `transport/live.ts`
    - handles websocket live-session open, chunk send, and live end signaling
-   `transport/sse.ts`
    - handles authenticated stream open, replay parsing, lifecycle completion, and disconnect classification
-   `types.ts`
    - defines the public contract boundary for requests, responses, stream events, and upload telemetry
-   `errors.ts`
    - normalizes thrown and HTTP-derived failures into `VeritieSDKError`

## Boundaries

-   The package root is the only public export boundary.
-   `VeritieSDK` owns imperative orchestration; transports should not become consumer-facing entrypoints.
-   `useVeritie` may track UI-consumable state, but it must not invent transport semantics that differ from `VeritieSDK`.
-   HTTP transport remains canonical for create/finalize/read/rerun routes.
-   Websocket is the primary live-session transport for MVP live capture; SSE remains assistive replay/recovery transport and general progress transport for non-live flows.
-   Pipeline selection is centralized in auth/header assembly for HTTP and SSE; websocket opens use signed bootstrap metadata instead of inventing a separate pipeline-targeting model.
-   Upload telemetry is SDK-authored client truth and may be forwarded additively to finalize.
-   The current single package is acceptable for MVP, but long-term runtime docs should treat `@veritie/sdk`, `@veritie/react`, and `@veritie/ui-react` as target-direction split surfaces.

## Invariants

-   `VeritieSDK` and `useVeritie` remain the only public runtime surfaces.
-   The SDK supports both batch upload and live websocket capture flows in MVP.
-   SSE uses authenticated `fetch`, not `EventSource`.
-   The SDK must not allow a protected HTTP/SSE request to leave without a non-empty pipeline alias.
-   Stream cleanup must not leak unhandled promise rejections.
-   Recoverable post-open network disconnects may be treated as handled only under the explicitly-defined stream rules.
-   Finalize remains backward compatible with `{ audio_uri }` while upload telemetry adoption is additive.
-   Preparation and higher-level lifecycle APIs are target-direction work; the current runtime remains transport-oriented but should not be documented as its final role.

## Non-Goals

-   Full final lifecycle controller and pipeline-handle API design
-   Server-side observability implementation
-   Historical analytics or dashboard transport concerns
-   Alternate streaming transports
