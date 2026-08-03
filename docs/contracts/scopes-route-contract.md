# Contract: Scopes Route Contract

## Purpose

Define the contract boundary for `/work/scopes/**` route payload assembly and validation.

## Scope

Included:

- Scope route locations under `app/(app)/work/scopes/**`
- Route contract assembly in `app/(app)/work/scopes/_page-model/build.ts`
- Route contract schema in `app/(app)/work/scopes/_page-model/schema.ts`
- Route contract enforcement in `app/(app)/work/scopes/_page-model/validate.ts`
- Embedded check table surfaces within scope pages

Out of scope:

- Check detail route-local contract assembly in `app/(app)/work/scopes/_check-page-model/*`
- Global context rail validator internals

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Any scope/lens shape break requires coordinated route updates and doc revision

## Definitions

- **Scopes route contract**: normalized `{ scope, lens?, railPayloadCandidate }` object for scope pages.
- **Scope route id**: one of `scopes_index`, `scopes_operations_readiness`, `scopes_workspace_resilience`, `scopes_knowledge_hygiene`, `scopes_delivery_observability`.
- **Check detail contract**: separate route-local contract used by nested check detail pages.

## Contract Shape (Conceptual)

### Required fields

- `scope` — scopes route scope identifier
- `railPayloadCandidate` — nullable payload produced by shared rail payload builder

### Optional fields

- `lens` — normalized scope lens (`scope` key only in public serialization)

## Invariants (Must Always Hold)

- Scope route payloads are composed via `buildScopesRouteContract(...)`.
- Scope overview routes remain lightweight and do not own check detail page-model composition.
- Zod schema validation executes before payload consumption.
- Invalid shape fails closed to `payload = null`.
- Nested check detail routes use `app/(app)/work/scopes/_check-page-model/*`.

## References

- Related contracts: `docs/contracts/context-rail-contract.md`, `docs/contracts/scope-lens-contract.md`, `docs/contracts/scope-check-inspection-contract.md`
