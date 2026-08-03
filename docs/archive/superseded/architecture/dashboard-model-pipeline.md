# Architecture — Dashboard Model Pipeline

## Purpose

Describe the target architecture for `/work` where route composition, domain model derivation, and section rendering are separated by stable boundaries.

## Scope

Covers:

- `app/work/page.tsx` composition responsibilities
- Dashboard model builder module(s) in `lib/work/*`
- Section component boundaries and typed model inputs
- Placement of reusable helpers/constants in global vs dashboard-scoped modules

Does not cover:

- Framework detail page architecture outside `/work`
- Backend service/API architecture for readiness computation

## Components

- **Dashboard route (`app/work/page.tsx`)**
  - reads normalized lens from URL
  - loads source data
  - invokes `buildDashboardModel(...)`
  - renders section components with typed model slices
  - emits rail payload from model snapshot fields
- **Model builder (`lib/work/build-dashboard-model`)**
  - owns lens filtering, metric derivation, narrative branching, action group derivation
  - returns one typed dashboard model object
- **Dashboard constants (`lib/work/constants`)**
  - owns dashboard-specific constants (weights, thresholds, section limits)
- **Global utilities**
  - `lib/format/date.ts` for reusable date formatting (e.g., `formatShortDate`)
  - `lib/ui/avatars.ts` for reusable actor/initials/avatar tone helpers
- **Section components (`components/work/*`)**
  - `ComplianceStateOverview`, `BlockingAndActions`, `ActiveWorkstreams`, `ActivitySignals`
  - accept only minimal typed props from model

## Boundaries

- Route must not own dashboard domain derivation logic.
- Model builder must not depend on React/component concerns.
- Section components render-only; no hidden domain recomputation.
- Global utility modules contain only route-agnostic helpers.
- Dashboard-scoped constants stay out of global namespace unless reused elsewhere.

## Invariants

- Lens behavior follows `lib/lens.ts` normalization semantics.
- Base universe and in-scope filtered sets remain distinct in model derivation.
- Rail snapshot fields are produced from dashboard model outputs.
- Section props remain stable and typed to avoid route/component coupling drift.

## Non-Goals

- Building a generic cross-route analytics engine in this refactor.
- Replacing existing rail container mechanics.
- Introducing backend-coupled rule engines in this branch.
