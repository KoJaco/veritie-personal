# Contract: Dashboard Frameworks Route Contract

## Purpose

Define the contract boundary for `/work/scopes/**` route payload assembly and validation.

## Scope

Included:

- Frameworks route locations under `app/(app)/work/scopes/**`
- Frameworks route contract assembly in `app/(app)/work/scopes/_page-model/build.ts`
- Frameworks route contract schema in `app/(app)/work/scopes/_page-model/schema.ts`
- Frameworks route contract enforcement in `app/(app)/work/scopes/_page-model/validate.ts`
- Embedded framework control table surfaces within framework pages

Out of scope:

- Control detail route-local contract assembly in `app/(app)/work/scopes/_control-page-model/*`
- Deep SOC2 Type II coverage derivation model in `frameworks/soc2/type-ii/_lib/model.ts`
- Global context rail validator internals

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Any scope/lens shape break requires coordinated route updates and doc revision

## Definitions

- **Frameworks route contract**: normalized `{ scope, lens?, railPayloadCandidate }` object for frameworks pages.
- **Scope**: one of `frameworks_index`, `frameworks_soc2`, `frameworks_essential_eight`, `frameworks_soc2_type_ii`.
- **Control detail contract**: separate route-local contract used by framework-specific nested control detail pages.

## Contract Shape (Conceptual)

### Required fields

- `scope` — frameworks route scope identifier
- `railPayloadCandidate` — nullable payload produced by shared rail payload builder

### Optional fields

- `lens` — framework lens (`framework`, optional `mode`, optional window fields)

## Invariants (Must Always Hold)

- Frameworks route payloads are composed via `buildFrameworksRouteContract(...)`.
- Framework overview routes remain lightweight and do not own control detail page-model composition.
- Zod schema validation executes before payload consumption.
- Runtime payload policy checks execute via shared rail payload validators.
- Contract validity requires both Zod shape validation and runtime policy validation to pass.
- Invalid shape fails closed to `payload = null`.
- Payload building still flows through shared `buildRailPayload(...)` guardrails.
- Nested control detail routes are supported under framework-specific static routes and use a separate route-local contract package.

## Error Handling

- Invalid contract shape yields `INVALID_SHAPE` validation and `null` payload.
- Shared payload-builder validation failures return `railPayloadCandidate = null`, propagated safely to slot.

## Examples

### Minimal valid example

```json
{
    "scope": "frameworks_index",
    "railPayloadCandidate": null
}
```

### Invalid example

```json
{
    "scope": "frameworks_unknown",
    "lens": { "framework": "SOC2" },
    "railPayloadCandidate": null
}
```

Expected handling: schema validation fails and route hydrates with `null` payload.

### Operational notes

- Frameworks route-local contracts live under `app/(app)/work/scopes/_page-model/*`.
- Control detail route-local contracts live under `app/(app)/work/scopes/_control-page-model/*`.
- Frameworks route shared UI helpers are colocated under `app/(app)/work/scopes/_components/*`.
- Context injection/composition behavior is unchanged; payloads still pass through shared `buildRailPayload(...)` and `ContextPayloadSlot`.
- Zod is the route-contract shape/type source; shared runtime validators remain the policy enforcement layer.

### References

- Related ADRs: `docs/adr/0013-dashboard-route-colocation-and-route-contract-packages.md`
- Related contracts: `docs/contracts/context-rail-contract.md`, `docs/contracts/framework-lens-contract.md`
- Related contracts: `docs/contracts/control-inspection-contract.md`
