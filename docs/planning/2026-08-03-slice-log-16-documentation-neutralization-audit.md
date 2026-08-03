# Slice Log 16: Documentation Neutralization Audit

Date: 2026-08-03

## Summary

Audited `docs/` for legacy domain-specific naming after slice 15 entity tagging neutralization. Neutralized remaining legacy vocabulary in active contracts, architecture notes, ADR-0010, and decision records. Extended terminology guardrails to cover decisions and additional legacy phrases in active documentation.

## Audit scope

| Area | Treatment |
| --- | --- |
| `docs/contracts/` (canonical) | Neutralized in this slice |
| `docs/architecture/` (canonical) | Neutralized in this slice |
| `docs/decisions/` | Neutralized in this slice |
| `docs/adr/0010-framework-lens-url-contract.md` | Rewritten to scope-lens contract |
| Other `docs/adr/*` | Historical banner added; bodies retained as decision records |
| `docs/planning/*` slice logs | Kept as migration history (past-tense legacy references OK) |
| `docs/archive/` | Kept as historical archive (no rewrite) |
| Superseded redirect stubs under `docs/contracts/` and `docs/architecture/` | Kept as intentional legacy path redirects |

## Findings (pre-fix)

### Active contracts still using legacy domain framing

- `work-model-contract.md` — operational overview field naming, Type II window/coverage copy
- `settings-route-contract.md` — scope mapping section still described as framework configuration with SOC 2 criteria
- `scope-check-inspection-contract.md` — legacy tag bridges mention
- `connections-route-contract.md` — generated-evidence wording

### Active architecture still using legacy domain framing

- `route-state-boundary-flow.md` — framework lens / backend framework policy
- `context-rail-resolver.md` — EvidenceTab and evidence fetching language
- `task-driven-ui-overview.md` — evidence in TaskContext description

### Active decisions still using legacy domain framing

- `framework-scope-caching-and-prefetch.md`, `lens-dialog-control.md`, `lens-security-hardening.md`, `context-rail-resolver.md`, `detail-header-action-placement.md`, `testing-coverage-strategy.md`, `artifact-format-mvp.md`, `non-modal-overlay-behavior.md`, `nextjs-security-upgrade.md`

### ADR-0010

- Title and body still described framework lens URL contract with mode/window semantics as primary framing instead of scope lens with legacy URL compat noted separately.

### Already handled (no change required)

- Slice 12 archived legacy evidence/control/framework contracts under `docs/archive/superseded/`
- Superseded redirect stubs correctly point to canonical scope/attachment/contracts
- Terminology guard already blocked retired routes and seed field names in active docs

## Completed in this slice

- Neutralized active contract, architecture, and decision docs listed above
- Rewrote ADR-0010 to scope-lens URL contract (legacy query compat documented as secondary)
- Added historical banners to pre-neutralization ADRs that retain original product framing
- Updated `docs/README.md` and `docs/planning/2026-08-02-domain-agnostic-current-status.md`
- Extended `scripts/check-terminology.mjs` active documentation checks to `docs/decisions/` and additional legacy phrase patterns

## Deferred

- Full body rewrites of historical ADRs beyond ADR-0010 (decision records preserved)
- Markdown artifact body copy inside `fixtures/markdown/artifacts/*.md`
- `docs/planning/route-spec.md` and older planning handoffs (marked historical; low traffic)
- `docs/clarifications/*` (historical Q&A; not implementation guidance)

## Verification

- `npm run check:terminology`
- `npm run typecheck -- --pretty false`
- `npm test`
- `npm run build`
