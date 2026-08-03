# Slice Log: 2026-06-08 Scope Contracts and Copy

## Completed

- Renamed the active rail route contract from dashboard/framework-centric IDs to `work`, `scopes_*`, `scope_checks_*`, and `resources_*`.
- Made `ScopeLens` the public contract type across the active lens and rail boundary while keeping `ScopeLens` as a temporary compatibility alias.
- Reworked scope route contracts and check detail contracts to expose `Scopes` and `Checks` terminology in the active page-model and rail payload layer.
- Fixed broken `checks/[checkId]` route imports created during the earlier bulk route rename.
- Updated active scope pages and check detail pages to normalize through `scope` IDs instead of constructing public route state from legacy framework query fields.
- Replaced visible `control`/`evidence` copy with `check`/`attachment` copy in active task, resource, document, and scope surfaces touched in this pass.
- Published the new canonical scope lens contract at `docs/contracts/scope-lens-contract.md`.
- Added a lightweight terminology guard at `scripts/check-terminology.mjs` and wired it into `npm run test:ci`.

## Contract Changes

- Canonical route IDs are now:
  - `work`
  - `scopes_index`
  - `scopes_operations_readiness`
  - `scopes_delivery_observability`
  - `scopes_workspace_resilience`
  - `scopes_knowledge_hygiene`
  - `scope_checks_index`
  - `scope_check_detail`
  - `resources_index`
  - `resources_detail`
- `RailContextData` now uses `scopesInView` instead of `frameworksInScope`.
- `PageModel.meta.scope` now uses `scopeId` instead of `frameworkId` in active builders and schemas touched by this slice.
- Active public lens documentation now treats `?scope=<id>` as the only supported URL contract.

## Deferred

- Full internal module/file renames away from `framework`, `control`, and `evidence` in stub adapters and lower-level data modules.
- Terminology cleanup for historical decision notes, archived contracts, and legacy test fixtures not yet marked or moved as archive-only.
- Expansion of the terminology guard from public docs and shell copy into a wider active-surface string-literal audit once the remaining route/page copy cleanup lands.
