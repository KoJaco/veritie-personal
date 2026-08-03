# Contract: Work Route Contract

## Purpose

Define the route contract boundary for `/work` between route composition, contract validation, and work overview rendering.

## Scope

Included:

- Work route location: `app/(app)/work/page.tsx`
- Route contract payload assembled in `app/(app)/work/_page-model/build.ts`
- Contract shape checks in `app/(app)/work/_page-model/schema.ts`
- Contract enforcement in `app/(app)/work/_page-model/validate.ts`
- Work view-model composition in `app/(app)/work/_page-model/composeVM.ts`

Out of scope:

- Global `PageModel` validator internals (`lib/page-model/validator.ts`)
- Generic context rail payload contract (`components/context/*`)
- Backend API contracts

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Any breaking route contract shape change requires doc update and coordinated route/test updates

## Definitions

- **Work view model**: route-domain projection used by `/work` sections.
- **Work route contract**: object containing `pageModel` and candidate context rail payload.
- **Fail-closed**: invalid contract or invalid `PageModel` returns `null` payload for rail hydration.

## Contract Shape (Conceptual)

### Required fields

- `pageModel` — strict top-level `PageModel` object (`meta`, `view`, `refs`, `sections`, `capabilities`, `actions`)
- `dashboardPayloadCandidate` — nullable rail payload candidate produced through the shared payload builder

### Optional fields

- `pageModel.refs` — optional references section
- Nested optional readiness fields inside rail snapshot payload data

## Invariants (Must Always Hold)

- Route builds contract via `buildDashboardContract(...)`.
- Contract shape is validated with Zod before enforcement.
- Runtime policy enforcement is executed after shape validation.
- Contract validity requires both shape + runtime policy checks to pass.
- Unknown top-level `PageModel` keys are rejected.
- JSON-safety and payload budget rules are enforced by shared validators.
- On validation failure, route does not hydrate invalid rail payload.

## References

- Related ADRs: `docs/adr/0013-dashboard-route-colocation-and-route-contract-packages.md`
- Related contracts: `docs/contracts/page-model-contract.md`, `docs/contracts/context-rail-contract.md`, `docs/contracts/work-model-contract.md`
