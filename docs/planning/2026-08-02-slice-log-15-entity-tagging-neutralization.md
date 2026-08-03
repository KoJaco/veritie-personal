# Slice 15: Entity Tagging Neutralization

Date: 2026-08-02

## Summary

Replaced legacy `frameworkTags` from the previous product build on Work entities with first-class `scopeIds: ScopeKey[]` and aligned lens matching, read models, UI labels, and stub seeds to operating scopes.

## Completed

- Added `scopeIdsMatchLens` / `filterScopeIdsForLens`; removed `scopeTagsMatchLens` legacy tag bridge.
- Replaced `FrameworkTag` / `frameworkTags` with `scopeIds` on tasks, documents, resources, attachments, workstreams, and activity seeds.
- Migrated [`lib/data-source/stub-normalized-stories.ts`](lib/data-source/stub-normalized-stories.ts) seeds and neutralized remaining legacy copy from the previous product build in normalized stories.
- Updated stub stores and read models to emit `scopeIds` / `scopeLabels` on task index/detail models.
- Updated documents, tasks, dashboard composeVM, and BlockingAndActions to scope-first filtering and display via `getScopeLabel`.
- Updated task/object/resource/attachment stub generators for scope-only tagging.
- Expanded terminology guard for Work stubs, normalized stories, and Work UI entity tagging.
- Kept legacy URL query param mapping (`mapLegacyLensToScope`) for backward compatibility only.

## Deferred

- Removing legacy lens query param support (`framework`, `mode`).
- Backend adapter implementation.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- `npm test`
- `npm run build`
