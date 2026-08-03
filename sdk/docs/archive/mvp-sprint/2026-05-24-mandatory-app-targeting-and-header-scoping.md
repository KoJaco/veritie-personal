# Proposal: Mandatory Pipeline Targeting and Header Scoping in the SDK

> Historical filename note: this proposal predates the 2026-05-30 app-group plus pipeline refactor. The accepted current contract is `pipelineAlias` plus `X-Veritie-Pipeline`.

## Status

Proposed

## Date

2026-05-24

## Problem

The SDK currently handles authentication but has no first-class concept of pipeline targeting. That is incompatible with the planned server move to account-scoped credentials plus explicit pipeline selection.

Without an SDK-level pipeline target:

- multi-pipeline integrations would need to manage headers manually
- callers could accidentally mix requests across pipelines
- SSE, live bootstrap, and HTTP flows could drift if pipeline selection is not applied uniformly

The SDK should make correct pipeline selection the default rather than an opt-in caller detail.

## Proposal

Require a default pipeline alias at SDK client construction and send it as a dedicated selector header on every server-bound request.

Recommended SDK contract:

- `VeritieClientConfig.pipelineAlias` is required
- SDK emits `X-Veritie-Pipeline: <alias>` on all protected server requests
- per-call `pipelineAlias` override is allowed when a caller intentionally needs a different pipeline for a specific operation
- HTTP, SSE, and live bootstrap flows all use the same selector header

This is the best tradeoff for usability and correctness:

- requiring a default pipeline alias at construction prevents accidental unscoped clients
- allowing per-call override preserves flexibility for multi-pipeline consumers
- performance cost is unchanged because the selector becomes one request header either way

The SDK should keep header application centralized rather than requiring individual call sites to manage selector transport.

## Scope

In scope:

- required default pipeline alias on SDK config
- per-call override semantics
- centralized selector header injection
- shared behavior across HTTP, SSE, and live transport bootstrap
- additive docs and typing updates for the new selector behavior

Out of scope:

- server-side auth resolution implementation
- frontend route refactors
- a broader warning-surface redesign beyond the additive support needed by the coordinated app-bundle work

## Implementation Outline

1. Extend public SDK config with a required `pipelineAlias` field.
2. Extend relevant per-call option types so callers may intentionally override `pipelineAlias` for one operation.
3. Update centralized auth/header assembly so `X-Veritie-Pipeline` is emitted uniformly across server-bound HTTP and stream requests.
4. Ensure SSE and live bootstrap flows use the same selector semantics as standard create/get/finalize/rerun flows.
5. Add additive error handling for missing or invalid app-alias config at SDK usage time.
6. Refresh SDK contracts and examples so app targeting is shown as mandatory client setup.

## Alternatives Considered

- **Require pipeline alias on every SDK method call** — explicit, but repetitive and easier to misuse in larger applications.
- **Expose pipeline targeting only through arbitrary caller-supplied headers** — flexible, but weak for type safety and easy to apply inconsistently.
- **Create one SDK client per pipeline with no override support** — workable, but less ergonomic for integrations that legitimately switch pipelines at runtime.

## Risks and Tradeoffs

- **Benefits** — makes correct pipeline targeting the default, keeps transport behavior uniform, and matches the server's principal-resolution model.
- **Costs / Risks** — public SDK config changes are required, and additive option plumbing touches multiple request surfaces.
- **Operational notes** — examples, tests, and runtime docs must show pipeline alias as part of normal SDK construction rather than as an advanced header tweak.

## Validation

- Unit tests: header assembly with default and override pipeline alias; missing-config failures; SSE/live path selector coverage.
- Integration tests: create/get/finalize/rerun/stream flows against different pipeline aliases with one account-scoped credential.
- Manual/operational checks: initialize one SDK client with a default pipeline alias; override one call to target another pipeline; inspect outgoing requests and resolved server behavior.

## References

- Related code: `sdk/src/auth.ts`, `sdk/src/client/veritie-sdk.ts`, `sdk/src/react/use-veritie.ts`, `sdk/src/types.ts`
- Related docs: `docs/archive/proposals/2026-05-24-app-bundle-multi-surface-alignment.md`, `server/docs/archive/mvp-sprint/proposals/2026-05-24-account-scoped-auth-and-app-alias-resolution.md`, `sdk/docs/contracts/veritie-sdk-runtime-contract.md`, `sdk/docs/architecture/veritie-sdk-runtime-boundary.md`
- Issue/PR: TBD
