# ADR-0011: Dashboard Model Builder and Thin Route Composition

## Status

Accepted

## Date

2026-02-23

## Context

`/work` currently carries substantial domain derivation logic in the route file (lens filtering, metrics, narrative generation, task grouping, and UI formatting helpers).  
As branch scope grows, this increases change risk, makes testing harder, and blurs boundaries between domain computation and rendering concerns.

We need a stable architecture where the route remains composition-focused and model construction is centralized behind a clear boundary.

## Decision

Adopt a dedicated dashboard domain model builder module, with `/work` as a thin composition layer.

- Move dashboard derivation logic to `lib/work/build-dashboard-model` (and related dashboard-scoped modules as needed).
- Keep `app/work/page.tsx` responsible for:
  - reading lens from URL
  - loading/fetching source data
  - invoking the model builder
  - rendering section components from typed view models
  - building rail payload from returned model fields
- Extract reusable generic helpers/constants from dashboard route into global utility/constant modules.

## Alternatives Considered

-   **Keep all logic in `app/work/page.tsx`** — rejected due to maintainability and testability degradation as branch surface expands.
-   **Move only UI sections and keep derivation in-page** — rejected because logic coupling remains and model reuse/testing remains weak.

## Consequences

-   **Pros**
-   Clear separation of data derivation and rendering composition.
-   Smaller, reviewable route changes for future branches.
-   Easier unit testing of lens-aware logic and narrative/metric branches.
-   **Cons**
-   Introduces more files and explicit model contracts to maintain.
-   Requires migration effort to preserve behavior parity.
-   **Follow-ups / TODOs** (optional)
-   Define and document dashboard model contract (`docs/contracts/work-model-contract.md`).
-   Extract section components with typed prop surfaces.
-   Add focused unit tests around model builder paths.

## References

-   Issue: #
-   PR: #
-   Related docs/contracts: `docs/contracts/work-model-contract.md`, `docs/architecture/work-model-pipeline.md`
