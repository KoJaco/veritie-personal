# Slice Log 10: Lens/Dashboard Internal Rename

Date: 2026-07-16

## Summary

Retired the remaining active lens helper and `/work` dashboard view-model
internals that carried framework/control/evidence compatibility names.

## Changes

- Renamed `lib/lens/framework-scope.ts` to `lib/lens/scope-matching.ts`.
- Replaced active lens exports/imports with scope-oriented names:
  `ScopeLens`, `ScopeKey`, `scopeKeyFromLens`, `scopeBadgeClass`,
  `scopeTagsMatchLens`, `filterTagsForLens`, `getScopeBound`, and
  `buildScopeCacheTag`.
- Removed the temporary `FrameworkLens` and `FrameworkKey` aliases.
- Renamed `/work` dashboard model internals from control/evidence fields to
  check/attachment fields:
  `checkAggregates`, `checksTotal`, `checksComplete`, `blockedChecks`,
  `unmappedChecks`, `missingAttachments`, and `scopesInView`.
- Added a stub-boundary helper for reading fixture `missingEvidenceCount` as a
  dashboard attachment count without leaking that field name into dashboard
  internals.
- Renamed PageModel feature flag `hasFrameworkScope` to `hasScopeFilter`.
- Updated dashboard and lens tests, active contracts, and current status docs.
- Extended the terminology guard to block reintroducing retired lens/dashboard
  compatibility paths and identifiers in active code.

## Deferred

- Fixture seed fields, IDs, and object types can still carry framework/control/
  evidence/asset terminology until the fixture normalization slice.
- Legacy lens query parsing for `framework`, `mode`, `window`, `start`, and
  `end` remains as input compatibility, but active surfaces serialize `scope`.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- `npm test -- --runInBand lib/lens lib/page-model components/lens 'app/(app)/work'`
- `npm test -- --runInBand 'app/\\(app\\)/work'`
- `npm test -- --runInBand`
- `npm run lint` (passes with 6 existing unused-variable warnings)
- `npm run build`
