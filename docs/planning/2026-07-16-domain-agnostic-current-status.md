# Domain-Agnostic Migration Current Status

Date: 2026-07-16

## Executive Summary

The project is now a compiling, tested assistant-scoped platform shell with a
mostly domain-neutral public surface. The remaining migration work is not a
route-tree migration; it is internal vocabulary, data-model, and documentation
cleanup.

Latest verified baseline after slice 10:

- TypeScript passes.
- Terminology check passes.
- Focused Jest passes for data-source, attachments, resource/attachment APIs,
  and active `/work` tasks, documents, resources, connections, and settings
  routes.
- Full Jest passes: 68 suites, 327 tests.
- Lint passes with 6 existing warnings.
- Production build passes.

## What We Have

### Stable Public Surface

- `/work`
- `/work/tasks`
- `/work/resources`
- `/work/documents`
- `/work/scopes`
- `/work/scopes/[scopeId]/checks/[checkId]`
- `/work/connections`
- `/work/settings`

The old public route families are treated as retired:

- `/dashboard`
- `/work/assets`
- `/work/evidence`
- `/work/frameworks`
- `/work/controls`

### Stable Platform Capabilities

- Server-built `PageModel` contracts.
- Route-scoped assistant rail context.
- Scope lens URL contract using only `scope`.
- Markdown rendering through `components/content/MarkdownRenderer.tsx`.
- Document pages rendering markdown fixture/content with version metadata.
- Generic resource create API and client.
- Generic attachment-version upload API and client.

## Completed Slice History

| Slice                              | Status   | Result                                                                                                                                     |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundation                         | Complete | Canonical migration plan and initial vocabulary direction.                                                                                 |
| Scope contracts and copy           | Complete | Public route IDs, scope lens contract, and initial copy migrated.                                                                          |
| Compile stabilization              | Complete | Typecheck restored and `/work` route contract stabilized.                                                                                  |
| Resource and attachment boundary   | Complete | Generic resource and attachment API/client/adapter boundaries added.                                                                       |
| Resources internal rename          | Complete | Active resources route internals use resource terminology.                                                                                 |
| Retire resource compatibility      | Complete | Legacy asset API/adapters/wrappers removed from the resource boundary.                                                                     |
| Attachments internal rename        | Complete | Active attachment API/client/component/data-source internals use attachment terminology; evidence compatibility route/store/model removed. |
| Task/document relationship cleanup | Complete | Active task/document page models and filters expose check/resource/attachment relationship names.                                          |
| Scope/check boundary rename        | Complete | Active scope route components, check route contracts, and data-source adapter use `checks` and `checkScope`.                               |
| Lens/dashboard internal rename     | Complete | Shared lens helpers use scope-oriented exports and `/work` dashboard view-model internals expose checks, attachments, and scopes.          |

## Current Compatibility Boundaries

These are intentional boundaries, not final architecture. Resource and
attachment compatibility are now retired. Fixture seed fields may still carry
old names until fixture normalization.

### Resources

Current preferred path:

- `getDataSourceAdapters().resources`
- `lib/data-source/resources-read-model.ts`
- `lib/data-source/stub-resource-store.ts`
- `components/resources/ResourceCreateFlow.tsx`
- `POST /api/resources`

Retired compatibility:

- `getDataSourceAdapters().assets`
- `lib/data-source/assets-read-model.ts`
- `lib/data-source/stub-asset-store.ts`
- `components/assets/AssetCreateFlow.tsx`
- `lib/assets/*`
- `POST /api/assets`

### Attachments

Current preferred path:

- `getDataSourceAdapters().attachments`
- `lib/data-source/attachments-read-model.ts`
- `lib/data-source/stub-attachment-store.ts`
- `components/attachments/AttachmentUploadFlow.tsx`
- `lib/attachments/upload-attachment-version-client.ts`
- `POST /api/attachments/versions`

Retired compatibility:

- `getDataSourceAdapters().evidence`
- `lib/data-source/evidence-read-model.ts`
- `lib/data-source/stub-evidence-store.ts`
- `components/evidence/*`
- `POST /api/evidence/versions`

### Task And Document Relationships

Current preferred path:

- Task filters use `check` and `resource` query parameters.
- Task read models expose `check`, `resource`, `attachments`, and
  `missingAttachmentCount`.
- Document page models expose supporting attachments.
- Document index sorting uses `missingAttachments`.

Deferred compatibility:

- Fixture seed fields and IDs may still include evidence, control, or asset
  terminology where they preserve named story references.

### Scopes And Checks

Current public path:

- `/work/scopes`
- `/work/scopes/[scopeId]/checks/[checkId]`
- scope lens contract

Temporary compatibility:

- fixture seed fields and object types still carry framework/control names

## What Is Left

### 1. Fixture Normalization

Size: medium to large.

Goal: remove remaining fixture-level evidence/control/asset naming after active
runtime boundaries are stable.

Remaining:

- Rename fixture IDs such as `asset_seed_3` and `ev_*` only with an explicit
  cross-story migration plan.
- Replace normalized-story seed fields such as `linkedEvidenceIds`,
  `missingEvidenceCount`, and `assetId`.
- Replace legacy control-shaped fixture object types after active route and
  adapter boundaries no longer depend on them.

Risk:

- Medium. Fixture IDs are used across named task, document, attachment,
  resource, and check stories.

### 2. Documentation Cleanup

Size: medium.

Goal: make active docs accurately describe the current reusable base.

Remaining:

- Archive or supersede old dashboard/framework/control/evidence contracts.
- Update architecture docs that still describe dashboard model pipelines or
  framework lens flows as current implementation.
- Keep ADRs as historical records unless they are directly linked as current
  guidance.
- Expand terminology guard into active docs only after compatibility docs are
  intentionally scoped.

Risk:

- Low technically, but high for project clarity if skipped.

## Suggested Next Slice

Do one of these, in order of preference:

1. Normalize fixture seed fields and IDs if you want to finish the relationship
   cleanup before scopes/checks.
2. Continue documentation cleanup if you want planning and architecture docs to
   align before another code-heavy slice.

## Current Guardrails

- Do not reintroduce retired public route families.
- New resource code must use resource terminology.
- New attachment code must use attachment terminology.
- Active task/document relationship code must use check/resource/attachment
  names; fixture-boundary aliases are the remaining exception.
- Keep TypeScript, terminology check, full Jest, and build green after each
  slice.
