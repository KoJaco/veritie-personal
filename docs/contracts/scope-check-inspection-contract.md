# Contract: Scope Check Inspection Contract

## Purpose

Define the frontend contract for scope check browsing and check detail inspection across scope-scoped Work routes.

## Scope

Included:

- Scope check table surfaces embedded within scope pages
- Scope-specific check detail routes under `app/(app)/work/scopes/**/checks/[checkId]`
- Check detail route-local contract assembly in `app/(app)/work/scopes/_check-page-model/*`
- Stub-backed check inspection read seam exposed through `ChecksReadAdapter`
- Read-only readiness, related attachments, and related task rendering behavior

Out of scope:

- Manual attachment-to-check mapping workflows
- Check editing or mutation surfaces
- Generic scope router refactors outside the current static scope IA
- Backend persistence or API ownership for check aggregates

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Breaking route, read-model, or page-model semantics require coordinated route, test, and doc updates

## Definitions

- **Check inspection**: browsing scope-scoped checks and opening a check detail page with readiness and related work or attachment summaries
- **Scope checks table**: read-only check list rendered inside a scope page
- **Check detail contract**: normalized `{ pageModel, checkScope, railPayloadCandidate }` object for one check detail route
- **Check read seam**: FE-facing adapter boundary that supplies `CheckSummaryReadModel` and `CheckDetailReadModel`

## Contract Shape (Conceptual)

### Required fields

- `ChecksReadAdapter.getChecksForScope(scope, count)` — returns compact, scope-scoped check summaries
- `ChecksReadAdapter.getCheckDetail(scope, id)` — returns one check detail read model
- `checkScope.scopeId` — one of the active scope IDs
- `pageModel.view.key` — `scope_check_detail`
- `railPayloadCandidate.scope` — `{ type: "scope_check_detail", id }`

## Invariants (Must Always Hold)

- Check inspection is read-only in this phase.
- Scope check tables preserve active lens state in navigation links.
- Check detail routes are nested under scope-specific static routes.
- Check detail contract validation fails closed to `payload = null`.
- Check detail pages expose compact readiness, task, and attachment summaries only.
- Stub check seeds resolve by `scopeId` through `lib/stubs/scope-checks.ts`; legacy tag bridges are not part of this contract.

## References

- Related contracts: `docs/contracts/scopes-route-contract.md`, `docs/contracts/context-rail-contract.md`, `docs/contracts/page-model-contract.md`
