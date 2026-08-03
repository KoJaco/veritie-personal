# ADR-0010: Scope Lens URL Contract

> **Note:** Filename retains `framework-lens` for link stability. The active contract is scope-first; legacy query keys are compatibility-only.

## Status

Accepted

## Date

02-23-2026 (updated 2026-08-03 for scope-first vocabulary)

## Context

The Work area supports scoped views (overview, tasks, resources, documents) and the context rail consumes lens metadata for summaries.  
Without a consistent lens contract, links drop scope between routes and page summaries drift from user intent.

We need a single, durable definition of:

- Canonical query param (`scope`)
- Normalization rules for operating scopes
- URL-preserving navigation behavior across Work routes
- Legacy query param mapping (`framework`, `mode`, `window`, `start`, `end`) for backward-compatible deep links only

## Decision

Adopt an explicit URL lens contract as the source of truth for scope filtering.

- Lens is always defined, defaulting to `scope=all`.
- Lens is a view filter, not a global app mode.
- Lens transitions are applied via shared helpers in `lib/lens/*`.
- Work navigation must preserve lens via `withLens(...)`.
- Rail payloads include lens metadata through shared payload construction.
- Active surfaces serialize only `scope`; legacy query keys are parsed and mapped to scopes but must not be emitted by new links.

## Alternatives Considered

- **Global in-memory lens store** — rejected because URL state would diverge from shared links/deep links and refresh behavior.
- **LocalStorage as primary source** — rejected because stale client state can override explicit route intent and break deterministic URLs.

## Consequences

- **Pros**
- Deterministic deep links and refresh behavior.
- Shared navigation behavior across pages and components.
- Clear contract for rail payloads and assistant context.

- **Cons**
- Requires disciplined use of `withLens(...)` on route links.
- URL management complexity increases on pages with many CTAs.
- Legacy query compatibility adds parser complexity until fully retired.

- **Follow-ups / TODOs** (optional)
- Document localStorage rehydration as an optional URL-empty fallback branch.
- Extend lens-aware behavior to additional scope detail flows as they mature.
- Retire legacy query param support after migration window closes.

## References

- Issue: #
- PR: #
- Related docs/contracts: `docs/contracts/scope-lens-contract.md`, `docs/contracts/context-rail-contract.md`
