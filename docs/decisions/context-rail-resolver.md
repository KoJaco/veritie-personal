# Decision Note: Context Rail Resolver MVP Decisions

## Date

2026-02-08

## Summary

Decide on a single-shell context rail resolver, a single render path for the rail, and consistent activity tab semantics across dashboard and detail routes.

## Decision

- Use a single `AppShellClient` at `/work/layout.tsx` with segment-based `routeId` resolution.
- Render `ContextRail` once (via `RailController`), and keep pinned layout as a dock-only container.
- Use `recent_activity` only on the dashboard and `activity` elsewhere; label dashboard as “Activity” and detail routes as “Activity” or “History”.

## Rationale

- Avoids hydration mismatches caused by payload-dependent route IDs.
- Simplifies rail rendering and prevents double-rendering bugs.
- Reduces user confusion by keeping activity semantics consistent.

## Impact

- Route config registry and tabs map are authoritative for rail behavior.
- Pinned layout provides placement but does not render a second rail.
- ContextTab must tolerate task or attachment context to support task routes.

## Follow-ups

- [ ] Implement ContextTab to handle task vs attachment primary objects safely.
- [ ] Verify dashboard vs detail activity labeling in tabs.

## References

- Related ADR/Contracts: `docs/adr/0009-context-rail-resolver.md`, `docs/contracts/context-rail-contract.md`
