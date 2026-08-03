# Slice Log: 2026-06-17 Compile Stabilization

## Completed

- Made the normalized public `ScopeLens` contract strict: `{ scope: ScopeId }`.
- Added an explicit legacy lens input boundary so old `framework`, `mode`, `window`, `start`, and `end` query values can still be parsed temporarily without weakening normalized lens output.
- Kept lens serialization scoped to `?scope=<id>` and stripped legacy lens keys when rewriting URLs.
- Updated work, task, resource, document, settings, scope, assistant, rail, and page-model tests to use scope literals and the current public route IDs.
- Updated rail payload validation to accept `data.lens.scope` and reject legacy lens keys in normalized payloads.
- Renamed rail snapshot fields exposed to UI/tests to neutral names such as `blockedChecks`, `missingAttachments`, and `unmappedChecks`.
- Restored compile coherence for the work overview export, work stub facade, data-source adapter imports, and tag-to-scope mapping.
- Fixed URL lens dialog tests to match the current component API and URL preservation behavior.
- Updated active context rail documentation for scope-only lens payloads and neutral snapshot names.

## Contract Changes

- `ScopeLens` normalized shape is now strict and public: `{ scope: ScopeId }`.
- Parser helpers may accept legacy query inputs, but returned values and rail payloads contain only `scope`.
- `PageModel.meta.scope` validates `scopeId`; legacy `frameworkId` is not accepted by active tests.
- Rail snapshot field names exposed to UI/tests now use checks/attachments terminology:
  - `blockedChecks`
  - `missingAttachments`
  - `unmappedChecks`
- Retired route segments and route IDs are treated as unknown in active route resolver tests:
  - `/dashboard`
  - `/work/assets`
  - `/work/evidence`
  - `/work/controls`
  - `/work/frameworks`
  - `assets_*`
  - `frameworks_*`
  - `framework_control_detail`
  - `evidence_index`
  - `evidence_detail`

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- `npm test -- components/context components/assistant-ui components/lens lib/lens lib/page-model`
- `npm test -- 'app/(app)/work'`
- Route regression searches for retired public paths and route IDs were run as part of the slice verification.

## Deferred

- Full deletion or generic renaming of internal evidence APIs, stores, read models, and lower-level components.
- Full internal rename of assets modules to resources.
- Full internal removal of framework/control naming from data adapters, stubs, and legacy read-model shapes that still back check/task views.
- Expansion of the terminology guard beyond the current narrow public-brand checks.
- Neutralization of all remaining seed data, markdown fixtures, and archived docs.
