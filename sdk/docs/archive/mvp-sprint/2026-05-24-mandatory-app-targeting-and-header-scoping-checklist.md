# Checklist: Mandatory Pipeline Targeting and Header Scoping in the SDK

Source proposal:
- [2026-05-24-mandatory-app-targeting-and-header-scoping.md](/home/korij/development/web/business/veritie/sdk/docs/archive/mvp-sprint/2026-05-24-mandatory-app-targeting-and-header-scoping.md)

## ADR Updates

- [ ] Update `sdk/docs/adr/ADR-0001-veritie-sdk-http-sse-and-react-surface.md`.
  - Add required default pipeline alias at client construction.
  - Add centralized selector-header behavior.
  - Add per-call override rationale and constraints.

## Contract Updates

- [ ] Update `sdk/docs/contracts/veritie-sdk-runtime-contract.md`.
  - Add `VeritieClientConfig.pipelineAlias` as a required field.
  - Add per-call override semantics where applicable.
  - Update examples so pipeline targeting is shown at client construction.

- [ ] Update `sdk/docs/contracts/veritie-sdk-stream-runtime-contract.md`.
  - Clarify that stream open/replay flows use the same pipeline selector header as HTTP calls.
  - Confirm any reconnect semantics remain scoped to the selected pipeline.

- [ ] Review `sdk/docs/contracts/veritie-sdk-upload-telemetry-runtime-contract.md`.
  - Confirm upload telemetry docs do not need any additive notes about pipeline targeting.

## Architecture Updates

- [ ] Update `sdk/docs/architecture/veritie-sdk-runtime-boundary.md`.
  - Show where selector-header logic lives.
  - Keep header emission centralized, not call-site-specific.
  - Confirm HTTP, SSE, and live bootstrap all share the same scoping behavior.

## Public API Shape Checks

- [ ] Choose whether the per-call override lives on a shared options base type or on each method-specific options type.
- [ ] Confirm React hook config mirrors the imperative client config exactly enough to avoid pipeline-targeting drift.
- [ ] Confirm the SDK never allows a request to go out without either a default pipeline alias or an explicit override.

## Example and Test Refresh

- [ ] Update all public examples to include `pipelineAlias`.
- [ ] Add one example showing override of the default pipeline alias for a single call.
- [ ] Add tests for header emission across create/get/finalize/rerun/stream/live bootstrap flows.

## Exit Criteria

- [ ] The SDK makes pipeline targeting mandatory by default.
- [ ] The selector contract stays centralized and uniform.
- [ ] SDK docs no longer imply that authentication alone selects the runtime pipeline.
