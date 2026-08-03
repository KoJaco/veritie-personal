# Decision: Scope Lens Caching and Prefetch Policy

## Status

Accepted

## Date

03-13-2026

## Context

Scope lens state is URL-driven and now hardened. As surfaces expand, we need explicit FE policy for:

- cache-tag naming consistency by lens/read-model
- bounded prefetch behavior during scope changes
- avoiding reliance on caching as primary thrash mitigation

Without a decision, scope switching behavior can drift across routes and cause inconsistent performance or over-prefetching.

## Decision

Adopt a bounded FE policy for scope lens caching and prefetch:

- Use deterministic scope-scoped cache tags via `lib/lens/scope-matching.ts`
- Keep prefetch bounded to four primary Work surfaces:
  - `/work`, `/work/tasks`, `/work/resources`, `/work/documents`
- Treat caching as additive optimization only:
  - do not rely on cache as primary query-thrash mitigation
  - maintain bounded all-scope read behavior in FE composition
- Keep implementation centralized in shared helpers under `lib/lens/scope-matching.ts`.

## Privacy and telemetry constraints

- No raw query-string logging for scope transitions.
- Lens parsing/logging remains sanitized via existing lens hardening path.
- Cache/prefetch helpers operate on normalized lens state only.

## Consequences

- **Pros**
  - Consistent scope behavior across dashboard surfaces.
  - Lower risk of over-prefetch and route-specific drift.
  - Integration-ready contract for backend read-model rollout.

- **Cons**
  - Requires discipline to reuse shared helpers instead of local route logic.
  - Prefetch budget may need retuning as new dashboard surfaces are added.

## References

- Related contracts: `docs/contracts/scope-matching-contract.md`
- Related decisions: `docs/decisions/lens-security-hardening.md`
- Issue/PR: #
