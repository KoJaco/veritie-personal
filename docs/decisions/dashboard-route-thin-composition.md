# Decision Note: Thin Dashboard Route with Model-Driven Sections

## Date

2026-02-23

## Summary

Adopt a thin composition approach for `/work`: route reads lens and source data, delegates domain derivation to a model builder, and renders typed section components from the resulting model.

## Decision

Refactor dashboard implementation so domain logic is owned by `lib/work/build-dashboard-model` and route/UI layers consume typed outputs only.

## Rationale

- Keeps route files small and easier to review.
- Makes lens-aware behavior deterministic and testable through pure model builders.
- Reduces accidental coupling between UI structure and derivation rules.
- Supports incremental extraction of shared constants/helpers without broad rewrites.

## Impact

This affects dashboard route composition, section component boundaries, utility/constant placement, and test strategy for dashboard behavior.

## Follow-ups

-   [ ] Extract dashboard model builder and dashboard-scoped constants.
-   [ ] Move reusable helpers to global utility modules (`lib/format/*`, `lib/ui/*`).
-   [ ] Extract dashboard sections into typed components that depend on model slices.

## References

-   Issue: #
-   PR: #
-   Related ADR/Contracts: `docs/adr/0011-dashboard-model-builder-refactor-boundary.md`, `docs/contracts/work-model-contract.md`
