# Proposal: SDK Pipeline Handle and Runtime Modes

## Status

Partially implemented

## Date

2026-05-26

## Problem

The current SDK already exposes:

- create/upload/finalize batch flows
- SSE progress streams
- live websocket session bootstrap and file streaming helpers

But the documented SDK role is still too transport-centric for the desired product.

What is missing from the docs:

- explicit live websocket-first runtime positioning
- lease preparation and hot-path expectations
- normalized lifecycle state as a first-class SDK concern
- runtime presets such as `background` and `observable`
- transitional guidance from the current single package to the intended package split

## Proposal

Document the SDK as evolving toward a lifecycle-aware runtime client while preserving current low-level APIs.

Direction:

1. Keep existing low-level APIs available.
2. Add a higher-level pipeline-handle model as the recommended path.
3. Support explicit preparation methods such as `prepareCapture()` and `prepareUpload()`.
4. Keep convenience methods such as `startCapture()` and `startUpload(...)` as ergonomic fallbacks.
5. Treat live websocket as the primary live-session transport and SSE as assistive replay/recovery transport.
6. Expose both raw events and normalized state.
7. Keep the current single package for now, but treat split packages as proposal-backed target direction:
   - `@veritie/sdk`
   - `@veritie/react`
   - `@veritie/ui-react`

Runtime preset names should be fixed now:

- `background` — **shipped for upload handles** via `submitAndDetach(...)` (batch_only + detach at `audio_persisted`)
- `observable`
- `review`
- `debug`

## Scope

In scope:

- SDK role clarification
- pipeline-handle direction
- preparation/hot-path semantics
- live websocket transport positioning
- normalized state plus raw events
- package split as a target-direction doc decision

Out of scope:

- immediate code split into separate npm packages
- full final public API design for every runtime helper
- frontend-specific rendering behavior

## Implementation Outline

1. Patch existing SDK architecture and contract docs so they no longer conflict with existing live websocket support.
2. Document preparation and pipeline-handle semantics as recommended future direction.
3. Keep the current package-root contract stable while making the transitional nature explicit.

## Alternatives Considered

- **Leave the SDK documented as transport-only** — rejected because the product direction requires lifecycle reduction and runtime-mode semantics.
- **Break the current low-level API immediately** — rejected because the current low-level surface is still useful and can coexist with a higher-level handle.

## Risks and Tradeoffs

- **Benefits** — gives downstream integrators a clearer target model, preserves current transport functionality, and reduces future package-surface surprises.
- **Costs / Risks** — transitional docs must be careful not to promise APIs that are not yet implemented.
- **Operational notes** — the docs should define the target role clearly while still describing the currently shipped surface accurately.

## Validation

- Unit tests: future SDK work should cover state reduction, pipeline completion conditions, and transport-mode fallback rules.
- Integration tests: future SDK work should verify websocket-first live flows, batch fallback rules, and canonical recovery behavior.
- Manual/operational checks: confirm SDK docs no longer say batch-only where live websocket support already exists.

## References

- Related code: `sdk/src/client/veritie-sdk.ts`, `sdk/src/react/use-veritie.ts`, `sdk/src/transport/live.ts`, `sdk/src/transport/sse.ts`
- Related docs: `docs/archive/proposals/2026-05-26-pipeline-lease-hot-path-and-runtime-modes.md`, `sdk/docs/architecture/veritie-sdk-runtime-boundary.md`, `sdk/docs/contracts/veritie-sdk-runtime-contract.md`
- Issue/PR: TBD
