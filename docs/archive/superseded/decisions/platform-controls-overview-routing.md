# Decision Note: Platform Controls Overview Routing

## Date

2026-03-27

## Summary

Implement aggregated controls inspection as a flat Platform route at `/work/controls`, separate from framework readiness pages and existing framework-nested control detail routes.

## Decision

- Add `Controls` as a flat Platform destination under `/work/*`
- Keep framework readiness and nested control detail pages unchanged
- Treat scoped controls as separate rows in the aggregated view
- Apply the active framework lens as a default filter when present, while keeping the aggregated route as the source of truth

## Rationale

- Matches the existing flat Platform IA better than introducing `/work/platform/*`
- Preserves the read-only framework control contract already in place
- Keeps branch 17 additive and narrow
- Avoids premature deduping logic across frameworks and modes

## Impact

This affects the Platform nav, route contracts, aggregated controls read seam, and tests for lens-aware controls inspection.

## References

- `docs/contracts/platform-controls-overview-contract.md`
- `docs/contracts/control-inspection-contract.md`
- `docs/adr/0004-sidebar-information-architecture-mvp.md`
