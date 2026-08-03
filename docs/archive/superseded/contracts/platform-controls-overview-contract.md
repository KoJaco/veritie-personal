# Contract: Platform Controls Overview

## Purpose

Define the frontend contract for the aggregated Platform-level controls inspection route at `/work/controls`.

## Scope

Included:

- Aggregated controls index route at `/work/controls`
- Cross-framework summary metrics and URL-backed filters
- Framework-scoped control rows with drill-in links to existing framework detail routes
- Stub/backend adapter seam for aggregated controls read models

Out of scope:

- Control mutation, reassignment, or remediation workflows
- Replacing framework readiness pages or nested framework control detail routes
- Deduping multiple scoped control instances into one merged logical row

## Versioning

- Current version: `v1`
- Compatibility: additive fields only
- Change policy: breaking route, filter-param, or read-model changes require coordinated route/test/doc updates

## Contract Shape

### Route

- Canonical route: `/work/controls`
- Page remains inspection-only
- Active framework lens may be applied as a default filter, but it is not the source of truth for the dataset

### URL-backed filters

- `controlFramework`: `SOC2_TYPE_I | SOC2_TYPE_II | E8 | ISO27001`
- `readiness`: repeated param of `blocked | unmapped | at_risk | complete`
- `ownerState`: repeated param of `assigned | missing`

### Read seam

- `ControlsReadAdapter.getAggregatedControls(query?)`
- Query shape:
  - `framework?: "all" | "SOC2_TYPE_I" | "SOC2_TYPE_II" | "E8" | "ISO27001"`
  - `readiness?: ControlReadinessStatus[]`
  - `ownerState?: ("assigned" | "missing")[]`

### Required row fields

- `id`
- `title`
- `framework`
- `mode?`
- `frameworkLabel`
- `readiness`
- `ownerState`
- `ownerName`
- `linkedTasksCount`
- `linkedEvidenceCount`
- `missingEvidenceCount`
- `updatedAt`
- `detailHref`

## Invariants

- One row represents one scoped control instance.
- Rows default to brokenness order: `blocked -> unmapped -> at_risk -> complete`.
- Primary row action opens the existing framework-specific control detail route for that row.
- Ownership state is limited to assigned vs missing for this phase.
- The route must not become a task execution or remediation surface.

## Error Handling

- Invalid filter params are ignored and the page falls back to safe defaults.
- Unsupported framework combinations degrade to `framework = "all"` at the aggregated route level.
- Missing owner data degrades to `ownerState = "missing"` with blank owner label rather than route failure.

## References

- Related contract: `docs/contracts/control-inspection-contract.md`
- Related plan: `docs/branch-plan.md`
