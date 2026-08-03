# Contract: Context Rail Contract

## Purpose

Define the boundary between server-provided context payloads and the client-resolved rail configuration that drives the Context Rail UI.

## Scope

Covers `RailContract` and `RailContextPayload` as consumed by `ContextRail` and tab components. Excludes internal component state and tab-specific data fetching.

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive optional fields only
- **Change policy:** Increment version on shape changes to `RailContract` or `RailContextPayload`.

## Definitions

- **RouteConfig**: Client-defined configuration for tabs and defaults per route.
- **RailContract**: Derived client contract combining RouteConfig and context payload.
- **Context payload**: Minimal server-provided data to scope the rail to a route or object.

## Contract Shape (Conceptual)

### Required fields

- `contractVersion` — numeric, currently `1`.
- `enabled` — whether the rail is allowed to render.
- `showTrigger` — whether the floating trigger can render when closed.
- `defaultTab` — tab key to select by default.
- `tabs` — ordered list of tabs with `{ key, label }`.

### Optional fields

- `context` — payload with `scope`, optional `primaryObject`, and optional `data`.
- `context.scope` — may reference scope browsing/detail scopes:
  - `scope_checks_index`
  - `scope_check_detail`
- `context.primaryObject` — may include `{ type: "check", id }` for check detail routes
- `context.data.lens` — normalized scope lens metadata:
  - `scope: "all" | "operations-readiness" | "delivery-observability" | "workspace-resilience" | "knowledge-hygiene"`
- `context.data.snapshot` — compact readiness aggregates:
  - `blockedChecks`, `overdueTasks`, `missingAttachments`
  - optional: `unmappedChecks`, `criteriaSetStatus`, `windowStatus`, `coverageGapDays`, `tasksTotal`, `tasksInScope`

## Invariants (Must Always Hold)

- `routeId` is derived from layout segments, not from payload.
- Unknown routes set `enabled: false` and `showTrigger: false`.
- `defaultTab` must be clamped to an available tab key at render time.
- Supported tabs are `assistant` and `context`.
- `context` tab consumes compact snapshot-style payload data when present.
- Page payloads should be built through a shared helper to keep shape stable.
- Any embedded page-scoped summaries must comply with `PageModel` JSON-safe and allowlist rules.
- Check detail payloads may include compact readiness/task/attachment counts through `context.data.snapshot`, but must not embed raw record payloads.
- Client route resolution must recognize `scope_checks_index` and `scope_check_detail` without depending on payload-derived route identity.
- Normalized rail payloads must contain `context.data.lens.scope` only. Legacy lens keys such as `framework`, `mode`, `window`, `start`, and `end` are accepted only by URL parser compatibility helpers and must not appear in rail payloads.

## Error Handling

Invalid or missing payloads do not crash rendering. When payload is `null`, the client clears the stored payload and renders the rail based on route configuration alone. Tab components must tolerate missing `context`.

## Examples

### Minimal valid example

```json
{
    "routeId": "work",
    "contractVersion": 1,
    "enabled": true,
    "showTrigger": true,
    "defaultTab": "assistant",
    "tabs": [{ "key": "assistant", "label": "Assistant" }]
}
```

### Invalid example

```json
{
    "enabled": true,
    "showTrigger": true,
    "tabs": []
}
```

Expected handling: treat as invalid; clamp default tab and avoid rendering tabs when empty.

### Operational notes

- Tabs should re-mount when route changes (e.g., key by `routeId`).
- Contract derivation uses pure memoized values to avoid hydration mismatch.
- Check detail routes currently resolve through scope-specific nested route segments and hydrate rail context through the shared payload helper.

### References

- Related ADRs: `docs/adr/0009-context-rail-resolver.md`
- Related ADRs: `docs/adr/0010-framework-lens-url-contract.md`
- Related contracts: `docs/contracts/scope-lens-contract.md`
- Related contracts: `docs/contracts/page-model-contract.md`
- Related contracts: `docs/contracts/scope-check-inspection-contract.md`
