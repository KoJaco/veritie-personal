# Contract: Work Model Contract

## Purpose

Define the boundary between `/work` data/model derivation and section rendering/route composition.

## Scope

Included:

- Work model builder inputs (scope lens + source data + time context)
- Typed output shape consumed by `/work` sections and rail payload builder
- Rules for deterministic derivation and lens-aware filtering

Out of scope:

- Backend API contracts for tasks/attachments/checks
- Scope detail page model contracts outside `/work`

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Breaking changes require coordinated updates to route + section props and doc version bump

## Definitions

- **Source data**: Raw stub/API entities loaded by route (`tasks`, work activity, etc.)
- **Base universe**: Unfiltered task collection used for global context metrics (for example, `scopesInView`)
- **In-scope set**: Lens-filtered collection used for lens-specific metrics and action groups
- **Section model**: Minimal typed data required for one `/work` section component

## Contract Shape (Conceptual)

### Required fields

- `lens` — normalized scope lens used for model derivation
- `asOf` — ISO timestamp for model snapshot
- `metrics` — readiness counts including lens-in-scope values
- `actionGroups` — precomputed task groups (`blocking`, `dueSoon`, `quickWins`)
- `narrative` — ordered lines derived from current lens + statuses
- `operationalOverview` — fields needed by `OperationalStateOverview`
- `scopesInView` — scope label set derived from base universe

### Optional fields

- `windowStatus` — valid/invalid for delivery-observability custom window completeness
- `criteriaSetStatus` — valid/invalid scope mapping configuration status
- `coverageGapDays` — delivery-observability coverage gap metric for the selected window
- `railSnapshot` — compact readiness payload projection for context rail

## Invariants (Must Always Hold)

- Model derivation must be deterministic for a fixed input set.
- Lens filtering must derive from normalized lens semantics (`lib/lens/*`).
- `scopesInView` is derived from the base universe, not filtered in-scope data.
- UI section components consume model slices and should not recompute domain logic.

## References

- Related ADRs: `docs/adr/0011-dashboard-model-builder-refactor-boundary.md`
- Related contracts: `docs/contracts/work-route-contract.md`, `docs/contracts/scope-matching-contract.md`
