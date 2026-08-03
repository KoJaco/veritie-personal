# Decision Note: Framework-Nested Control Inspection Routing

## Date

2026-03-27

## Summary

Implement control inspection as framework-nested, read-only routes under the existing static framework IA rather than introducing a generic framework router refactor during the control-views branch.

## Decision

Control inspection is exposed through framework-specific nested detail routes and embedded framework control tables:

- `SOC 2 Type I -> /work/scopes/operations-readiness/checks/[controlId]`
- `SOC 2 Type II -> /work/scopes/operations-readinessi/checks/[controlId]`
- `Essential Eight -> /work/scopes/workspace-resilience/checks/[controlId]`

The phase remains read-only and consumes existing evidence/task relationships without introducing control mutations or mandatory mapping workflows.

## Rationale

- Preserves current framework IA and avoids a route-taxonomy rewrite during a focused feature branch.
- Keeps control inspection aligned with active framework scope and existing lens-preserving navigation helpers.
- Lets control detail use a dedicated route-local contract without forcing framework overview pages into heavier page-model composition.
- Limits scope so evidence upload remains independent of control inspection rollout.

## Impact

This affects framework route structure, control detail routing, route-local contract ownership for control detail, and documentation of canonical control inspection behavior.

## Follow-ups

- [ ] Re-evaluate a generic framework/control router only if more frameworks require deeper shared routing behavior.
- [ ] Document backend control aggregate expectations once the stub-backed control read seam is replaced.

## References

- Issue: #
- PR: #
- Related ADR/Contracts: `docs/contracts/control-inspection-contract.md`, `docs/contracts/work-frameworks-route-contract.md`
