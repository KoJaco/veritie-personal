# Slice 09: Scope/Check Boundary Rename

Date: 2026-07-16

## Summary

Moved the active scope/check route and data-source boundary away from
framework/control naming.

## Completed

- Added `lib/data-source/checks-read-model.ts`.
- Removed `lib/data-source/control-read-model.ts`.
- Replaced `DataSourceAdapters.controls` with `DataSourceAdapters.checks`.
- Replaced `getFrameworkControls`, `getControlDetail`, and
  `getAggregatedControls` with `getChecksForScope`, `getCheckDetail`, and
  `getAggregatedChecks`.
- Replaced active check route contracts from `frameworkScope` to
  `checkScope: { scopeId }`.
- Renamed active scope files from `_control-page-model`,
  `ControlInspection`, `ControlDetailPage`, and `FrameworkShared` to
  `_check-page-model`, `CheckInspection`, `CheckDetailPage`, and
  `ScopeShared`.
- Extended the terminology guard to prevent reintroducing the removed
  scope/check compatibility paths and adapter methods.

## Deferred

- Lens helper files and aliases still include framework-compatible naming.
- `/work` dashboard aggregate internals still include control/evidence naming.
- Fixture seeds still use framework/control/evidence/asset-shaped fields and
  IDs behind adapter boundaries.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- Focused Jest for `lib/data-source` and active `/work/scopes` routes
- Full Jest: 68 suites, 327 tests
- `npm run lint` with existing warnings only
- `npm run build`
