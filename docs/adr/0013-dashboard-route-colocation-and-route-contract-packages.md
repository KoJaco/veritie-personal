# ADR-0013: Dashboard Route Colocation and Route Contract Packages

## Status

Accepted

## Date

2026-03-02

## Context

Dashboard route code had become split across route files, shared component directories, and shared lib directories, even when logic was only used by `/work` and `/work/scopes`.

This blurred ownership boundaries and made it harder to tell whether a module was route-scoped or truly reusable. It also weakened contract boundaries by scattering route contract assembly and validation concerns.

## Decision

Adopt strict route-level colocation for dashboard route-scoped modules:

- Route-scoped React components live under `app/(app)/work/**/_components`.
- Route-scoped non-contract helpers/constants/types live under `app/(app)/work/**/_lib`.
- Route-scoped contract assembly and validation live under `app/(app)/work/**/_page-model`.
- Shared directories (`/lib`, `/components`) only hold cross-route code.

For this migration:

- `/work` and `/work/scopes` were moved under `app/(app)/work`.
- Legacy route-only surfaces under `components/work`, `components/frameworks`, `lib/work`, and `lib/page-model/adapters/work` were removed.
- Route contract packages were introduced for both dashboard root and frameworks subtree.

Route contract validation policy:

- Zod is the canonical mechanism for route contract shape definition and inferred TypeScript route-contract types.
- Runtime policy validators remain authoritative for cross-cutting constraints, including JSON-serializability, payload budgets, allowlist constraints, and no-raw-blob payload rules.
- A route contract is valid only when it passes both gates:
  1) Zod shape validation
  2) Runtime policy validation/enforcement.

## Alternatives Considered

- **Keep route helpers in `/lib/work`** — rejected because it keeps route ownership ambiguous and encourages route-only creep into shared space.
- **Keep route components in `/components/work`** — rejected because these components are not shared and should be colocated with the route that owns them.

## Consequences

- **Pros**
- Route ownership is explicit and discoverable.
- Contract assembly/validation is enforced at route boundaries.
- Shared directories are cleaner and easier to govern.

- **Cons**
- Larger import-path churn during migration.
- Existing docs and references must be updated to new paths over time.

- **Follow-ups / TODOs** (optional)
- Add lint-level guardrails to prevent route-only modules from being added back into shared directories.
- Continue doc reconciliation for older architecture/decision docs that reference legacy dashboard paths.

## References

- Issue: TBD
- PR: TBD
- Related docs/contracts: `docs/contracts/work-route-contract.md`, `docs/contracts/scopes-route-contract.md`, `docs/contracts/work-model-contract.md`
