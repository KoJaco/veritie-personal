# Branch Plan Archive Snapshot: 01-03-2026


## Objective

Ship framework-aware navigation and dashboards with minimal UI surface increase, while simplifying the context rail to two tabs (`assistant`, `context`) and stabilizing a lens-based payload contract.

## Scope Guardrails

- Keep changes small and reviewable by branch.
- Prefer stubs where backend dependencies are not ready.
- Do not expand beyond routes and contracts listed here.
- Preserve existing behavior unless explicitly changed below.

## Progress Checkoff

- [x]   1. `feat/framework-routes-nav-mvp`
- [x]   2. `feat-soc2-type-ii-timeline-stub`
- [x]   3. `feat/work-lens-url-contract`
- [x]   4. `feat/work-lens-aware-metrics-and-actions`
- [x]   5. `feat/context-rail-two-tabs-and-lens-payload`
- [x]   6. `feat/framework-pages-index-overview-stubs`
- [x]   8. `test/lens-system-reconciliation`
- [x]   9. `feat/tests-and-docs-lens-rail`
- [x]   12. `refactor/work-work-page-maintainability`
- [x]   14. `feat/objects-route-stubs`

## Branch Sequence (completed in this snapshot)

### 1) `feat/framework-routes-nav-mvp`

**Goal:** Introduce framework routes and minimal navigation entry points.

**Includes**

- Add routes:
    - `/work/scopes`
    - `/work/scopes/soc2`
    - `/work/scopes/soc2/type-ii`
    - `/work/scopes/essential-eight`
- Add sidebar nav item: `Frameworks` -> `/work/scopes`
- Keep existing nav behavior unchanged otherwise.

**Acceptance Criteria**

- All four routes resolve without runtime errors.
- Sidebar shows `Frameworks` and navigates correctly.
- New pages can be simple stubs with clear placeholders.

**Out of Scope**

- Lens-aware filtering behavior.
- Timeline visuals.
- Context rail contract changes.

---

### 2) `feat-soc2-type-ii-timeline-stub`

**Goal:** Ship visible Type II page progress quickly with a credible timeline stub.

**Includes**

- On `/work/scopes/soc2/type-ii`:
    - window selector (`30d`, `90d`, `180d`, `custom`)
    - selected window display in main content area
    - coverage timeline component with covered/gap segments (stub data)
    - gap detail affordance (hover/click)
    - summary row: `Gap days`, `Criteria impacted`, `Longest gap`
    - CTA links to evidence/tasks preserving Type II lens
- Add stub adapter shape:
    - `window: { start, end }`
    - `gaps: Array<{ start, end, days, criteriaIds[] }>`
    - `criteriaCoverage: Array<{ id, name, gapDays, coveredPercent }>`

**Acceptance Criteria**

- Type II page renders timeline and summary with deterministic stub data.
- Window selector updates displayed state.
- CTA links include `framework=SOC2&mode=TYPE_II` plus selected window.

**Out of Scope**

- Real backend coverage integration.
- Dashboard-wide lens behavior.

---

### 3) `feat/work-lens-url-contract`

**Goal:** Standardize lens query semantics and propagate through dashboard navigation.

**Includes**

- Add helpers in `lib/lens.ts` (or equivalent):
    - `parseLens(searchParams)`
    - `serializeLens(lens)`
    - `withLens(href, lens)`
    - `getLensFromSearchParams()` (or alias wrapper)
- Canonical query keys:
    - `framework`, `mode`, `window`, `start`, `end`
- Add dashboard framework/mode selector:
    - options: `All`, `Essential Eight`, `SOC 2 Type I`, `SOC 2 Type II`
    - show window selector only for SOC2 Type II (`90d` default)
- Persist selection in URL.
- Update dashboard CTA/link generation to preserve lens for:
    - `/work/tasks`
    - `/work/evidence`
    - `/work/documents`

**Acceptance Criteria**

- Reloading dashboard preserves selector state from URL.
- Lens survives navigation from dashboard cards/CTAs.
- `window=custom` uses ISO `start`/`end` when provided.

**Out of Scope**

- Full lens-aware metrics and narrative logic.

---

### 4) `feat/work-lens-aware-metrics-and-actions`

**Goal:** Make dashboard content responsive to selected lens with minimal complexity growth.

**Includes**

- Extend `DashboardMetrics` with:
    - `unmappedControls`
    - `criteriaSetStatus?: "valid" | "invalid"`
    - `coverageGapDays?: number`
- Update overview cards:
    - add fifth card (`Unmapped Controls`) or lens-dependent replacement strategy
- Update `buildNarrative` branching:
    - SOC2 Type II includes window + gap language
    - criteria invalid forces blocked/config guidance narrative
- Lens-aware filtering for action groups:
    - `blockingTasks`, `dueSoonTasks`, `quickWinTasks`
- Add framework tag/pill to task cards based on existing tags.

**Acceptance Criteria**

- Switching lens changes metrics/actions in predictable ways.
- Narrative changes by lens and config-invalid state.
- Task cards show framework hint without adding new layout rails.

**Out of Scope**

- Deep backend rule engines.

---

### 5) `feat/context-rail-two-tabs-and-lens-payload`

**Goal:** Implement the decided rail end-state: tabs reduced to `assistant` and `context`, with deterministic lens snapshot contract.

**Includes**

- Update tab keys/types:
    - `RailTabKey = "assistant" | "context"`
    - remove/deprecate `evidence/activity/metadata/recent_activity` from active configs
- Add `ContextTab` component (dense, read-only):
    - as-of timestamp + timezone
    - lens metadata (framework/mode/window)
    - readiness snapshot counts
    - top blockers (N=3-5) with deep links
    - hard-stop indicator for criteria invalid
- Update tab mapping so only `assistant` + `context` render.
- Update route config registry across enabled routes:
    - tabs: `assistant`, `context`
    - defaultTab: `assistant`
- Extend rail payload contract with:
    - `lens`
    - `snapshot` (`blockedControls`, `overdueTasks`, `missingEvidence`, `unmappedControls?`, `criteriaSetStatus?`, `coverageGapDays?`)
- Add single payload builder helper:
    - `buildRailPayload({ scope, lens, aggregates })`

**Acceptance Criteria**

- Rail only shows two tabs on all enabled routes.
- Context tab renders compact snapshot and no long lists/feed cards.
- Lens metadata is present in payload for dashboard/framework/task/evidence scopes.

**Out of Scope**

- Reworking rail container mechanics (drawer/dock behavior stays unchanged).

---

### 6) `feat/framework-pages-index-overview-stubs`

**Goal:** Fill framework page UX to support navigation and status understanding.

**Includes**

- `/work/scopes` cards for:
    - Essential Eight
    - SOC 2 Type I
    - SOC 2 Type II
- `/work/scopes/essential-eight` stub:
    - maturity breakdown placeholder (0-3)
    - unmapped warning surface
    - CTA to tasks with `framework=E8`
- `/work/scopes/soc2` overview:
    - Type I/Type II split + CTAs
    - criteria set status + validation messages
    - CTA to settings/config

**Acceptance Criteria**

- Each framework page has usable status summary + actionable CTA links.
- SOC2 invalid criteria state is visibly fail-closed.

**Out of Scope**

- Final production styling or backend-true maturity values.

---

### 8) `test/lens-system-reconciliation`

**Goal:** Consolidated test branch for all completed framework/lens/work/context behavior, with focus on edge cases, regression prevention, and contract reconciliation.

**Includes**

- Unit tests for `lib/lens/utils.ts`:
    - `parseLens()`: valid/invalid/malformed inputs, unknown frameworks, empty params
    - `normalizeLens()`: SOC2-only mode/window semantics, half-lens rejection
    - `serializeLens()`: canonical output, deterministic ordering
    - `withLens()`: preserves non-lens params, handles absolute/relative URLs
    - `withoutLens()`: clean removal of lens keys
    - `scopeKeyFromLens()`: correct key derivation for all framework/mode combos
- Unit tests for dashboard model/lens branching:
    - `lib/work/build-dashboard-model.ts`
    - narrative branching (default, SOC2 Type II, criteria invalid, invalid custom window)
    - lens-aware task filtering and metrics derivation (`unmappedControls`, `coverageGapDays`, `criteriaSetStatus`, `windowStatus`)
- Unit tests for Type II coverage model:
    - `components/frameworks/soc2II/model.ts`
    - segment construction, totals (`Gap days`, `Longest gap`, `Criteria impacted`), stable gap-key behavior, custom window bounds
- Component tests (React) for framework surfaces:
    - `components/frameworks/soc2II/WindowPresetSelector.tsx`
        - custom range opens in `Dialog` (desktop) / `Drawer` (mobile)
        - Apply/Cancel behavior
        - selected dates flow to callbacks
    - `components/frameworks/soc2II/CoverageBar.tsx`
        - gap point selection state
        - gap date callouts render and select
    - `components/frameworks/shared.tsx`
        - `FrameworkQuickNav` link rendering
        - section/stat placeholders render expected labels
- Route/page composition tests:
    - `app/work/scopes/page.tsx`
        - preserves existing lens when present
        - does not force/set lens when absent
    - `app/work/scopes/soc2/page.tsx`
        - SOC2 hub sections/CTAs render
        - Type I/Type II navigation links exist
    - `app/work/scopes/soc2/type-i/page.tsx`
        - wireframe blocks render (at-a-glance, narrative, action placeholders, config status)
    - `app/work/scopes/soc2/type-ii/page.tsx`
        - timeline view composition
        - custom date range selection updates model window and generated task/evidence links
    - `app/work/scopes/essential-eight/page.tsx`
        - wireframe blocks render (maturity breakdown, gaps, mapping warning, no-data state)
- Context/route reconciliation tests:
    - `components/context/client-route-resolver.tsx` route mapping for framework paths
    - `components/context/route-config-registry.ts` and `components/context/tabs/AssistantTab.tsx` expected scope coverage
    - `components/context/build-rail-payload.ts` lens + snapshot projection
- Integration tests:
    - lens propagation across dashboard navigation paths (`/work` → `/work/tasks` → task detail)
    - lens survival through selector interactions
    - URL ↔ UI state synchronization (selector reflects URL, URL reflects selector)
    - rail payload includes correct lens metadata
- Reconciliation tests:
    - Document and test any currently broken/undefined edge cases
    - Verify `window=custom` with missing/invalid `start`/`end` degrades gracefully
    - Verify unknown framework values normalize to `all` without errors
    - Verify custom date dialog/drawer flow does not produce stale state on repeated open/cancel/apply
    - Test rapid lens/window switching (no race conditions or stale state)
- Regression test cases:
    - Capture any bugs found during testing as permanent test cases
    - Add cases for previously encountered issues (if any)

**Acceptance Criteria**

- All lens utility functions have >90% line coverage.
- Framework route/page composition behavior is covered by tests for all framework routes.
- All dashboard/framework navigation paths preserve lens correctly (verified by tests).
- Edge cases and malformed inputs are handled without runtime errors.
- Any discovered bugs are fixed and covered by regression tests.
- Test suite runs in CI without flakiness.

**Out of Scope**

- E2E browser automation tests (defer to separate effort if needed).
- Performance/load testing of lens parsing.
- Backend API contract testing.

---

### 9) `feat/tests-and-docs-lens-rail`

**Goal:** Docs-only follow-up after branch 8 consolidates all testing.

**Includes**

- Docs updates:
    - ADR/decision: framework lens via URL params
    - ADR/decision: rail tab reduction
    - design note: Type II timeline stub shape

**Acceptance Criteria**

- Docs reflect new contracts and route behavior.

**Out of Scope**

- Additional test implementation (covered in branch 8).

---

### 12) `refactor/work-work-page-maintainability`

**Goal:** Refactor `/work` for maintainability with a thin route, domain model builder, extracted typed sections, and clearer constants/util boundaries.

**Includes**

- Add `lib/work/build-dashboard-model` (and dashboard-scoped helper modules as needed).
- Move dashboard derivation logic from route file into model builder:
    - lens-aware filtering and grouping
    - metrics derivation
    - narrative branching
    - action group derivation
    - framework-in-scope derivation
    - rail snapshot projection fields
- Keep `app/work/page.tsx` focused on composition only:
    - read lens
    - load/fetch source data
    - build dashboard model
    - render section components from typed model slices
    - build rail payload from model output
- Extract sections into `components/work/*`:
    - `ComplianceStateOverview`
    - `BlockingAndActions`
    - `ActiveWorkstreams`
    - `ActivitySignals`
- Move constants to appropriate modules:
    - dashboard-scoped constants in `lib/work/constants`
    - global reusable constants in shared `lib` constants modules where applicable
- Move global reusable helpers out of route file:
    - date formatting helpers into `lib/format/date.ts` (e.g. `formatShortDate`)
    - avatar helpers into `lib/ui/avatars.ts` (e.g. `getActorInitials`, `getActorAvatarToneClass`)

**Acceptance Criteria**

- `/work` route is thin and composition-focused.
- Dashboard domain logic is owned by the model builder and returns a typed model object.
- Sections are extracted into typed components and only accept required model props.
- Reusable helpers/constants are moved out of the route with clear ownership boundaries.
- Dashboard behavior and output remain functionally equivalent.

**Out of Scope**

- Reworking framework detail pages.
- Backend data-source changes.
- Broad utility-layer rewrite across unrelated routes.

---

### 14) `feat/objects-route-stubs`

**Goal:** Make `/work/documents` usable for wireframe validation with a simple list-style surface and detail navigation, while enabling lens/tag filter checks and markdown renderer testing.

**Includes**

- Objects index route (`/work/documents`):
    - render a simple list-like view using existing surface/card styling patterns
    - each row/item shows object title + short summary + framework tags
    - each row/item links to object detail route
- Object detail route (`/work/documents/[id]`):
    - ensure object detail view is navigable from index
    - preserve/use current markdown rendering path so fixture markdown can be validated
- Stub model enrichment for objects:
    - add short summary field for list rendering
    - attach framework tags suitable for lens filtering checks
    - add optional purpose field (stub text)
    - add optional related `taskId` for link-out affordance in detail/list
- Lens filtering behavior validation support:
    - object tags align with framework lens taxonomy (`SOC2_TYPE_I`, `SOC2_TYPE_II`, `E8`, `ISO27001`)
    - index rendering can be scoped by current lens using existing filter utilities/contracts

**Acceptance Criteria**

- `/work/documents` renders a list-style stub view with clickable object entries.
- `/work/documents/[id]` can be reached from index and renders detail without runtime errors.
- Detail rendering path exercises markdown renderer with fixture-backed content.
- Object stubs include summary + tags (+ purpose/related task where available).
- Lens changes produce predictable object scoping based on object tags.

**Out of Scope**

- Production-grade objects information architecture and final UI polish.
- Backend objects API integration.
- Advanced object search/sort/filter controls beyond simple lens scoping.

---

## Notes

- This archive captures branches completed as of 01-03-2026.
- Remaining branches were moved back to `docs/branch-plan.md` as the active plan.
