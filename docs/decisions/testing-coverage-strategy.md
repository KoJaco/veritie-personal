# Decision Note: Testing Coverage Strategy (Risk-Based + Contract-Based)

## Date

2026-03-01

## Summary

This project does **not** target blanket 100% code coverage across all frontend code.
Instead, coverage is prioritized by risk and contract criticality:

- High-risk contract boundaries should target near-complete coverage.
- Low-risk structural/presentational code should be tested selectively.
- Coverage percent is a health signal, not the goal itself.

## Decision

Adopt a two-tier testing strategy:

1. **Contract-critical paths** (must-not-break invariants) receive strict coverage expectations.
2. **Low-risk UI glue** receives pragmatic coverage based on behavior risk and change frequency.

Global 100% coverage is not required and should not be pursued as a standalone objective.

## Rationale

- Frontend code includes structural wrappers, render-only composition, and third-party integration glue where exhaustive tests add maintenance cost without reducing meaningful risk.
- Chasing global 100% often causes brittle tests, over-mocking, and slower iteration.
- Risk-based testing puts effort where regressions are costly and hard to detect manually.
- Contract-based testing protects boundaries that define correctness and safety across layers.

## Coverage Policy

### Global expectation (repository-wide)

- No universal 100% line/branch requirement.
- Require stable passing quality gates: `lint`, `typecheck`, `test:ci`, `build`.
- Improve coverage where risk is highest, not where it is easiest to inflate numbers.

### Contract-critical expectation (must-test areas)

For contract-critical modules and invariants, target **very high coverage** (ideally 100%, minimum 90%+ for lines/branches unless explicitly justified).

## Must-Not-Break Invariants and Required Testing Areas

### 1) `PageModel` is JSON-safe, allowlisted, and payload-bounded

Required tests:

- Valid payload acceptance at boundary.
- Rejection of non-JSON-safe values.
- Rejection of unknown/unallowlisted keys.
- Payload size threshold behavior (warning + hard fail).
- Deterministic serialization behavior where required by contract.

Primary locations:

- `docs/contracts/page-model-contract.md`
- Runtime validation module(s) introduced for `PageModel` boundary enforcement.

### 2) `RouteContext` payload is safe (IDs/summaries only)

Required tests:

- Reject raw/unsafe payload shapes.
- Verify only summary/ref-safe shapes pass.
- Fail-closed behavior on invalid payload.

Primary locations:

- `docs/contracts/context-rail-contract.md`
- `docs/contracts/route-state-boundary-contract.md`
- Runtime validation and boundary injection modules for route context.

### 3) `FocusContext` stays pointer-only

Required tests:

- Ensure pointer schema constraints (no heavy embedded objects).
- Ensure state transitions do not mutate into object-heavy shape.

Primary locations:

- Branches introducing `FocusContext` runtime/store modules.

### 4) Scope lens is preserved across navigation

Required tests:

- Lens parse/normalize/serialize roundtrip.
- Lens persistence across route transitions and link helpers.
- Invalid lens inputs degrade safely.

Primary locations:

- `lib/lens/utils.ts` and `lib/lens/__tests__/utils.test.ts`
- Route-aware link/helper usage in Work/task/attachment/document navigation.

### 5) Server actions use domain modules and enforce authz server-side

Required tests:

- Action invocation routed through correct domain action modules.
- Authz/tenancy checks enforced at action boundary.
- No client-side bypass path for protected mutations.

Primary locations:

- `src/actions/<domain>/<capability>.ts` (when introduced)
- Action boundary tests (unit + integration-level where feasible).

## Lower-Priority / Selective Testing Candidates (Examples)

The following categories generally do **not** require exhaustive tests unless logic/risk increases:

- Pure presentational wrappers and visual shells with minimal branching.
- Thin `components/ui/*` wrappers around trusted third-party primitives.
- Static layout composition that carries no domain logic.
- One-line re-export modules and type-only files.
- Styling-only changes with no behavior change.

Testing is still recommended when these areas introduce:

- Conditional logic.
- Accessibility-critical behavior.
- Security-sensitive rendering.
- Cross-route state impact.

## Practical Review Checklist

For each PR:

1. Does it touch a must-not-break invariant?
2. If yes, are invariant tests added or updated?
3. If no, are tests still valuable enough to justify maintenance cost?
4. Are we improving real risk coverage rather than metric-only coverage?

## Non-Goals

- Enforcing universal 100% coverage for all frontend files.
- Requiring snapshot-heavy tests for purely visual structure.
- Mocking third-party internals solely to increase percentage metrics.

## References

- `docs/decisions/testing-framework.md`
- `docs/contracts/page-model-contract.md`
- `docs/contracts/context-rail-contract.md`
- `docs/contracts/route-state-boundary-contract.md`
- `docs/contracts/scope-lens-contract.md`
