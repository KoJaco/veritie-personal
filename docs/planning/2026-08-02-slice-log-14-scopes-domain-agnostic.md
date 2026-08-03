# Slice 14: Scopes Domain Agnostic

Date: 2026-08-02

## Summary

Migrated `/work/scopes` from previous-product UI and stub data to domain-agnostic operating scopes.

## Completed

- Added `lib/stubs/scope-checks.ts` with scope-first check seeds (`chk_or_*`, `chk_do_*`, `chk_wr_*`, `chk_kh_*`).
- Switched `ChecksReadAdapter.getChecksForScope` to filter by `scopeId` instead of `frameworkTags`.
- Renamed aggregated check presets and added knowledge-hygiene coverage (30 total checks).
- Replaced `lib/stubs/soc2-type-ii.ts` timeline with `lib/stubs/scope-coverage-timeline.ts` (`checkIds`, `checkCoverage`).
- Renamed delivery observability timeline components (`CoverageTimelineClient`, `CheckCoverageSnapshotList`).
- Neutralized copy and component exports across all four scope pages.
- Renamed settings config to `ScopeMappingConfigStub` / `getScopeMappingConfigStub`.
- Removed `legacy` from `ScopeDefinition`; kept `mapLegacyLensToScope` for URL compat.
- Updated `StoryCheckScope` to `{ scopeId }` in normalized dashboard seeds.
- Expanded terminology guard for `app/(app)/work/scopes/**`.

## Deferred

- Removing `frameworkTags` from tasks, documents, resources, and dashboard workstreams globally.
- Removing legacy lens query param support (`framework`, `mode`).
- Backend adapter implementation for checks.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- Focused Jest for `app/(app)/work/scopes`, `lib/data-source`, `lib/stubs`
- `npm run build`
