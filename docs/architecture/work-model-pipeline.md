# Architecture — Work Model Pipeline

## Purpose

Describe the architecture for `/work` where route composition, domain model derivation, and section rendering are separated by stable boundaries.

## Scope

Covers:

- `app/(app)/work/page.tsx` composition responsibilities
- Work model builder in `app/(app)/work/_page-model/composeVM.ts`
- Section component boundaries and typed model inputs
- Route-local constants in `app/(app)/work/_lib/constants.ts`

Does not cover:

- Scope detail page architecture outside `/work`
- Backend service/API architecture for readiness computation

## Components

- **Work route (`app/(app)/work/page.tsx`)**
  - reads normalized scope lens from URL
  - loads source data through data-source adapters
  - invokes `composeWorkDashboardModel(...)`
  - renders section components with typed model slices
  - emits rail payload from model snapshot fields
- **Model builder (`app/(app)/work/_page-model/composeVM.ts`)**
  - owns lens filtering, metric derivation, narrative branching, action group derivation
  - returns one typed work model object
- **Section components (`app/(app)/work/_components/*`)**
  - `OperationalStateOverview`, `BlockingAndActions`, `ActiveWorkstreams`, `ActivitySignals`
  - accept only minimal typed props from model

## References

- Related contracts: `docs/contracts/work-model-contract.md`, `docs/contracts/work-route-contract.md`
- Related ADRs: `docs/adr/0011-dashboard-model-builder-refactor-boundary.md`
