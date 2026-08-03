# Domain-Agnostic Migration: Next-Slice Handoff

Date: 2026-06-14

## Purpose

This ticket hands the migration to the next agent at the point where the public
shell is substantially renamed, but internal contracts, fixtures, and tests are
not yet coherent. The next slice should stabilize the new public contract before
another broad rename or deletion pass.

Canonical plan:
`docs/planning/2026-06-08-domain-agnostic-migration-plan.md`

Previous slice logs:

- `docs/planning/2026-06-08-slice-log-01-foundation.md`
- `docs/planning/2026-06-08-slice-log-02-scope-contracts-and-copy.md`

## Current Assessment

The migration is approximately halfway complete. Public routes, navigation, and
the visible global lens are ahead of internal types, data-source modules,
fixtures, tests, and active documentation.

| Phase | Status | Notes |
| --- | --- | --- |
| Planning and inventory | Mostly complete | The canonical plan and two slice logs exist. This handoff adds the missing current-state inventory and next executable slice. |
| Public taxonomy and docs | Partial | Primary navigation and several canonical docs use the new vocabulary. Many active docs and fixtures still use the old domain language. |
| Scope contract and route architecture | Partial to major | The `/work` route family and scope routes exist. Public route IDs are renamed. Lens internals and tests still carry the old contract. |
| Surface migration | Partial | Assets are publicly presented as Resources and the top-level Evidence surface is gone. Evidence/assets internals and visible residual copy remain. |
| Internal cleanup and hardening | Early | A narrow terminology guard passes, but typecheck currently fails and the guard does not yet cover all banned terms or active surfaces. |

## Completed Public Contract

Preserve these changes. Do not reintroduce compatibility routes or old public
route IDs while stabilizing the internals.

- The primary route family is `/work`.
- Primary routes exist for Tasks, Resources, Documents, Scopes, Connections,
  and Settings.
- Scope routes use `/work/scopes/[scopeId]/checks/[checkId]`.
- The sidebar uses the new visible taxonomy in
  `components/static/AppSidebar.tsx`.
- Public route IDs use `work`, `resources_*`, `scopes_*`,
  `scope_checks_index`, and `scope_check_detail` in
  `components/context/types.ts`.
- The scope index is data-driven from `SCOPE_DEFINITIONS` in
  `app/(app)/work/scopes/page.tsx`.
- The URL serializer emits only `?scope=<id>`.
- The canonical scope contract is documented in
  `docs/contracts/scope-lens-contract.md`.
- The terminology check is wired into `test:ci` through
  `scripts/check-terminology.mjs` and `package.json`.

## Known Broken Baseline

### Verification

- `npm run check:terminology` passes.
- `npm run typecheck -- --pretty false` fails.
- The working tree is large and intentionally in progress: 240 status entries
  and a tracked diff summary of 233 files changed. Work with the current tree;
  do not reset or revert route-tree changes.

### Typecheck Failure Groups

1. Lens callers and tests construct old lens objects without the required
   `scope` field. The largest concentration is under `lib/lens/__tests__`,
   `app/(app)/work/**/__tests__`, and `components/context/__tests__`.
2. `app/(app)/work/_components/BlockingAndActions.tsx` maps old domain tags to
   values that are no longer valid `ScopeKey` values.
3. `app/(app)/work/page.tsx` imports `OperationalStateOverview`, while
   `app/(app)/work/_components/index.ts` exports
   `ComplianceStateOverview`.
4. `lib/stubs/index.ts` exports a missing `./work` module.
5. `lib/data-source/stub-adapter.ts` imports missing
   `getDashboardTasksStub` and `getWorkDashboardStub` functions.
6. Assistant/context tests still use old route IDs such as `dashboard`,
   `assets_*`, and old scope/control IDs.
7. Resources and scopes page-model tests still assert old route IDs.
8. `components/lens/__tests__/UrlLensDialogControl.test.tsx` has a mock icon
   prop typing failure.

### Contract Inconsistencies

- `lib/lens/types.ts` defines `ScopeLens`, but the type still contains old
  framework/mode/window fields and a deprecated alias.
- `components/context/types.ts` uses the new route IDs, but readiness snapshot
  fields still include control/evidence-specific names.
- Old first-class evidence/assets APIs, components, and data-source modules
  remain even though their top-level public surfaces have been removed.
- The terminology guard scans a narrow target list and only checks the legacy
  product/domain branding. It does not yet enforce the complete banned-term
  policy from the canonical plan.

## Next Slice: Compile Stabilization and Compatibility Closure

### Objective

Make the renamed `/work` and scope-based public contract internally coherent and
restore a passing typecheck. This slice should close transitional compile gaps,
not expand into a full evidence/data-module deletion pass.

### Work Order

1. Define the lens transition boundary.
   - Keep normalized `ScopeLens` strict and scope-based.
   - If old query inputs still need to be parsed temporarily, introduce an
     explicitly named input/compatibility type rather than weakening
     `ScopeLens`.
   - Update tests and fixtures to construct normalized scope lenses.
   - Keep serialization limited to the `scope` query parameter.

2. Repair root work-page and stub exports.
   - Resolve the `OperationalStateOverview` versus
     `ComplianceStateOverview` mismatch with neutral naming.
   - Restore or replace the missing work-dashboard stub exports.
   - Remove references to old dashboard-named stub functions where practical.

3. Update route-scoped assistant and context tests.
   - Replace old route IDs with the new public route IDs.
   - Replace old context payload fields with scope-oriented fields.
   - Preserve deterministic assistant thread-key behavior.

4. Update page-model and route tests.
   - Replace `assets_*` expectations with `resources_*`.
   - Replace old framework/control route expectations with scope/check IDs.
   - Update lens fixtures to include valid neutral scopes.

5. Fix the remaining isolated type failures.
   - Replace old tag-to-scope mappings in `BlockingAndActions`.
   - Correct the URL lens dialog test icon mock typing.

6. Verify and log the slice.
   - Run typecheck, focused tests, and the terminology check.
   - Add a dated slice log describing contract decisions and deferred cleanup.

## Acceptance Criteria

- `npm run typecheck -- --pretty false` passes.
- Focused tests for context, assistant runtime, lens utilities, work page models,
  scopes, and resources pass.
- `npm run check:terminology` remains passing.
- No route or test reintroduces `/dashboard`, `/work/evidence`,
  `/work/controls`, `/work/frameworks`, or `/work/assets`.
- Normalized public lens serialization uses only `?scope=<id>`.
- Existing `/work` navigation and public route IDs remain unchanged.
- A dated slice log is added under `docs/planning/`.

## Deferred Until After Stabilization

- Full deletion or generic renaming of evidence APIs, stores, read models, and
  embedded evidence components.
- Full internal rename of all assets modules to resources.
- Removal of every old framework/control field from internal snapshots and data
  adapters.
- Comprehensive active-doc archive/supersession cleanup.
- Expansion of the terminology guard to every banned term and active fixture.
- Neutralization of all remaining stub data and markdown artifacts.

## High-Signal References

- Canonical plan:
  `docs/planning/2026-06-08-domain-agnostic-migration-plan.md`
- Sidebar taxonomy: `components/static/AppSidebar.tsx`
- Route and rail contracts: `components/context/types.ts`
- Scope lens types: `lib/lens/types.ts`
- Scope URL behavior: `lib/lens/utils.ts`
- Scope index: `app/(app)/work/scopes/page.tsx`
- Work root import mismatch: `app/(app)/work/page.tsx` and
  `app/(app)/work/_components/index.ts`
- Invalid scope mapping:
  `app/(app)/work/_components/BlockingAndActions.tsx`
- Broken stub exports: `lib/stubs/index.ts` and
  `lib/data-source/stub-adapter.ts`
- Terminology guard: `scripts/check-terminology.mjs`

## Suggested Verification Commands

```sh
npm run typecheck -- --pretty false
npm run check:terminology
npm test -- components/context components/assistant-ui lib/lens
npm test -- 'app/(app)/work'
rg -n '/dashboard|/work/(evidence|controls|frameworks|assets)' app components lib
rg -n 'dashboard|assets_|frameworks_|framework_control_detail' components/context components/assistant-ui 'app/(app)/work'
```

## Handoff Notes

- Treat the current worktree as the migration source of truth. The old
  `app/(app)/dashboard/**` tree is deleted and the new `app/(app)/work/**` tree
  is currently untracked, so git may not present these changes as clean renames.
- Prefer a strict new normalized contract plus an explicit temporary parser
  boundary. Making `scope` optional again would hide incomplete migration work.
- Do not broaden the slice until typecheck is green. The remaining internal
  rename/deletion work will be easier and safer from a compiling baseline.
