# Contract: Scope View Contract

## Purpose

Define the frontend contract for scope-scoped read behavior across Work surfaces, including bounded `all` behavior, cache-tag naming, and prefetch expectations.

## Scope

Included:

- Scope view semantics for FE consumers of read models
- Read-model key expectations for FE composition boundaries
- Required compound index expectations (documented for backend integration)
- Bounded `scope=all` query/render behavior in FE
- Scope-scoped cache tag policy and prefetch expectations

Out of scope:

- Backend query implementation details
- Database migration ownership
- Mutation invalidation wiring beyond FE naming policy

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Breaking changes to read-model keys or scope semantics require coordinated FE contract updates

## Definitions

- **Scope view:** URL-lens derived filter state (`scope`)
- **Read model key:** FE integration key for pre-aggregated data reads
- **All-scope bound:** Deterministic max item budget when `scope=all`

## Contract Shape (Conceptual)

### Required read model keys

Note that this is all up to change. These are suggested. Waiting to see DB shape.

- `control_aggregates`
- `dashboard_metrics`
- `task_work_queue`

### Required FE policies

- FE treats scope switching as **filtered read behavior**, not client recompute of full universes.
- `scope=all` behavior is bounded per route surface:
    - work: `32`
    - tasks: `48`
    - documents: `24`
    - resources: `24`
- Cache tags are deterministic and lens-scoped:
    - `scope_view:v1:<read_model>:<scope>`
- Prefetch is bounded to primary Work routes only:
    - `/work`
    - `/work/tasks`
    - `/work/resources`
    - `/work/documents`
    - `/work/scopes`

## Invariants (Must Always Hold)

- URL lens is the canonical scope input for FE route composition.
- Scope helpers are shared; route files should not duplicate legacy mapping rules.
- Cache is additive optimization and not the primary mitigation for query thrash.
- Prefetch lists are bounded and must not fan out unbounded scope combinations.

## Index Expectations (Backend Integration Contract)

The FE expects backend support for compound indexes that can satisfy scoped read patterns without table scans:

- `task_work_queue`: tenant + scope + status + due date
- `control_aggregates`: tenant + scope + check domain
- `dashboard_metrics`: tenant + scope + snapshot/as-of

These are FE dependency expectations and do not prescribe a specific storage engine.

## Error Handling

- Invalid or malformed lens input fails closed to normalized safe scope (`scope=all`) per lens contract.
- If scoped reads are unavailable, FE degrades to safe placeholders and bounded stubs.
- Missing cache invalidation wiring does not block rendering; cache tags remain deterministic metadata.

## Operational notes

- Shared helpers live in `lib/lens/scope-matching.ts` behind scope-oriented exports.
- Route files should consume shared bounds/matching helpers for deterministic parity.
- Keep read-model identifiers stable for future contract-and-stub switch wiring.
- Route composition should read domain data through the minimal data-source adapter seam (`lib/data-source/*`), with backend adapter behavior intentionally deferred.

## References

- Related contracts: `docs/contracts/scope-lens-contract.md`
- Related ADRs: `docs/adr/0010-framework-lens-url-contract.md`
- Issue/PR: #
