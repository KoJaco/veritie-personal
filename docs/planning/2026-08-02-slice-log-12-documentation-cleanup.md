# Slice Log 12: Documentation Cleanup

Date: 2026-08-02

## Summary

Archived legacy contracts and architecture notes from the previous product build, published neutral
canonical documentation for the current Work platform shell, and extended the
terminology guard to active documentation paths.

## Completed

### Canonical contracts added

- `docs/contracts/work-route-contract.md`
- `docs/contracts/work-model-contract.md`
- `docs/contracts/scopes-route-contract.md`
- `docs/contracts/scope-check-inspection-contract.md`
- `docs/contracts/attachments-route-contract.md`
- `docs/contracts/attachments-model-contract.md`
- `docs/contracts/attachments-embedded-display-contract.md`
- `docs/contracts/resources-route-contract.md`

### Canonical architecture added

- `docs/architecture/work-model-pipeline.md`
- `docs/architecture/scope-lens-flow.md`

### Archived to `docs/archive/superseded/`

- Legacy evidence/control/framework/platform-controls/resources-compatibility contracts
- `dashboard-model-pipeline.md`, `framework-lens-flow.md`
- `framework-control-inspection-routing.md`, `platform-controls-overview-routing.md`
- `branch-plan.md`

### Superseded redirect stubs

Legacy paths under `docs/contracts/` and `docs/architecture/` now point to the
canonical documents and archived copies.

### Index and guide updates

- Rewrote `docs/README.md` with the active contract map
- Updated `docs/fixtures/markdown.md` intro and realism guidance for neutral vocabulary
- Updated `docs/contracts/context-rail-contract.md` references
- Updated `docs/architecture/route-state-boundary-flow.md` references
- Updated `docs/decisions/framework-scope-caching-and-prefetch.md` route list

### Guardrails

- Extended `scripts/check-terminology.mjs` with active documentation checks for
  retired routes, fixture slugs, and legacy seed field names (skipping superseded
  redirect stubs and allowlisted negation lines)

## Deferred

- Markdown artifact body copy neutralization inside `fixtures/markdown/artifacts/*.md`
- Historical ADR body rewrites (ADRs remain as decision records)

## Verification

- `npm run check:terminology`
- `npm run typecheck -- --pretty false`
- `npm test -- --runInBand`
- `npm run build`
