# Branch Plan: Contract Lock + Rail + Evidence/Assets Execution

> Status: superseded for migration planning.
>
> This file is retained as historical execution context for the source project.
> For the current domain-agnostic base migration state, use
> `docs/planning/2026-07-16-domain-agnostic-current-status.md` and the latest
> slice logs under `docs/planning/`.

## Objective

Re-sequence frontend execution around hard architectural boundaries first, then deliver evidence/versioning/assets onboarding work without contract drift.

## Scope Guardrails

- Keep changes small and reviewable by branch.
- Treat `PageModel` and `RouteContext` as public, versionable contracts.
- Prefer explicit contracts over inferred shape behavior.
- Do not expand into backend implementation details beyond FE-required contracts.

## Locked Architectural Directives

### A) PageModel Public API (Non-negotiable)

- Pages are Server Components only (`no "use client"` at page level).
- Page responsibilities: server data load, PageModel composition, action-key exposure, `ContextPayloadSlot` injection.
- `PageModel` must be JSON-serializable, allowlisted, bounded by payload budget, and contain IDs/summaries only.
- `PageModel` must not include class instances, Dates/Maps/Sets, raw markdown/full docs, or unbounded raw arrays.

### B) Assistant Rail Architecture (Non-negotiable)

- Rail is a route-scoped workflow copilot (not a global app store).
- Context arrives from server via `ContextPayloadSlot` only.
- Tool execution is explicit and auditable; no invented state.
- Prompt construction is lazy on invocation.
- Store separation is enforced:
    - `RouteContext` (stable, server-injected, allowlisted)
    - `FocusContext` (pointer-only, volatile)
    - `AssistantRunState` (streaming/tool lifecycle)

### C) Server Actions Organization (Non-negotiable)

- Domain-first actions: `src/actions/<domain>/<capability>.ts`.
- AuthZ and tenancy validation live inside actions.
- PageModel exposes action keys only, never action functions.
- No hidden mutation registries.

### D) Framework Scope + Dashboard Rules (Non-negotiable)

- Framework scope is canonical in URL (`searchParams` as source of truth).
- Navigation helpers preserve scope.
- Switcher disabled when tenant has only one framework.
- Read-model and index expectations are explicit contracts for FE integration:
    - Read models: `control_aggregates`, `dashboard_metrics`, `task_work_queue`
    - Required compound indexing documented for tasks/checks/evidence/mappings/read models.
- Caching strategy:
    - Use safe RSC caching + `revalidateTag`
    - Do not treat cache as primary thrash mitigation
    - Prefetch alternate scopes
    - Keep `all frameworks` bounded

### E) Assets Domain (Non-negotiable)

- Assets are compliance posture objects (not CMDB).
- MVP categories: Devices, Services, Data.
- Assets are tenant-level; framework scope is via mapping.
- Services and Connections are separate entities and must remain distinct in IA and UI.
- Connecting/disconnecting integrations must not implicitly create/delete posture history incorrectly.

## Progress Checkoff

- [x]   1. `chore/pagemodel-lock`
- [x]   2. `chore/quality-gates-and-docs`
- [x]   3. `chore/route-context-guards`
- [x]   4. `refactor/assistant-rail-state-and-prompt`
- [x]   5. `refactor/actions-domain-boundary` _(DEFERRED pending backend merge; no server actions yet)_
- [x]   6. `refactor/server-client-route-boundary`
- [x]   7. `test/work-route-boundary`
- [x]   8. `test/ui-shell-regression`
- [x] 8A. `chore/premvp-hardening-pass`
- [x]   9. `feat/settings-framework-config`
- [x]   10. `security/lens-hardening`
- [x]   11. `chore/scope-matching-contracts`
- [x]   12. `chore/contracts-and-stub-switch`
- [x]   13. `feat/evidence-upload`
- [x] 13A. `feat/control-views` _(or `feat/framework-control-inspection`)_
- [x]   14. `feat/evidence-versioning`
- [x]   15. `feat/objects-filtering`
- [x]   16. `feat/assets-domain-separation`
- [x]   17. `feat/platform-controls-overview`
- [x]   18. `feat/platform-route-ui`
- [x]   19. `feat/tasks-route-ui`
- [x]   20. `chore/stub-data-normalisation`
- [x]   21. `refactor/page-component-normalisation`
- [x]   22. `feat/onboarding-skeleton`
- [ ]   23. `refactor/codebase-hardening-and-normalisation`

## Branch Sequence (in order)

### 1) `chore/pagemodel-lock` (DONE)

**Goal:** Lock and document the PageModel public API contract.

**Includes**

- Add/confirm canonical PageModel spec docs.
- Set `docs/contracts/page-model-contract.md` as canonical source.
- Define allowlisted top-level keys and JSON-only constraints.
- Document strict payload budget requirements.
- Enforce “IDs/summaries only” rule for sections and refs.

**Acceptance Criteria**

- PageModel contract is explicit, versionable, and auditable in repo docs.
- No page contract docs permit raw full-record payloads.

---

### 2) `chore/quality-gates-and-docs` (DONE)

**Goal:** Close architecture/documentation/testing drift found in the project scan so contracts are enforced in code and quality gates are reliable.

**Includes**

- Quality gates and CI alignment:
    - Add explicit `typecheck` script to `package.json`.
    - Fix current TypeScript failures in tests and ensure strict mode clean `tsc --noEmit`.
    - Add/confirm CI workflow to require `lint`, `typecheck`, `test`, and `build` for PR merge.
    - Ensure lint ignores generated coverage artifacts (or exclude coverage paths from lint runs).
- Test strategy upgrades:
    - Add targeted tests for context rail and route-state integration boundaries (`ContextPayloadSlot`, `ContextRailProvider`, route hook boundaries), excluding payload allowlist/budget enforcement tests owned by branch 3.
    - Add focused integration-style coverage for lens propagation across dashboard -> tasks/evidence/objects routes.
    - Raise meaningful coverage in critical paths (shell/boundary/model contracts) rather than broad shallow snapshots.
- Documentation reconciliation:
    - Remove stale/placeholder copy and obvious typos in docs that represent canonical guidance.
    - Reconcile documentation references to actual files/tools in repo (for example, jest config path/name consistency).
    - Resolve ADR numbering/index hygiene and ensure one canonical active plan reference.
    - Ensure docs reflect implemented behavior and explicitly flag planned-but-not-implemented items.

**Acceptance Criteria**

- `npm run lint`, `npm run typecheck` (or equivalent), `npm run test:ci`, and `npm run build` all pass locally and in CI.
- TypeScript strict check passes without ad-hoc suppressions for known failing cases.
- Critical architectural boundaries (server route state, rail payload injection, route resolver behavior) have regression tests, excluding payload allowlist/budget enforcement cases owned by branch 3.
- Documentation contains no known stale file references for quality tooling/config, and ADR/plan indexing is internally consistent.

---

### 3) `chore/route-context-guards` (DONE)

**Goal:** Enforce RouteContext safety and payload limits at runtime/build-time.

**Includes**

- Add schema/assertion layer for `PageModel` and `RouteContext`.
- Add allowlist validation for payload shape.
- Add payload-size budget checks with failure behavior.
- Add tests for raw-doc rejection and oversize payload rejection.

**Acceptance Criteria**

- RouteContext fails closed on invalid/unallowlisted/oversize payloads.
- No raw markdown/full docs can enter rail payloads.
- Contract docs and runtime behavior are aligned for payload validation boundaries.

---

### 4) `refactor/assistant-rail-state-and-prompt` (DONE)

**Goal:** Implement locked store boundaries and lazy prompt construction.

**Includes**

- Enforce three-store architecture (`RouteContext`, `FocusContext`, `AssistantRunState`).
- Restrict FocusContext to pointer-only shape (`entityPointer`, `subviewPointer`, `intent`).
- Remove any object-heavy focus coupling.
- Build prompt lazily on invocation (no giant prompt rebuild on focus changes).
- Fix loading indicator behavior while preserving rail determinism.

**Note**

`FocusContext` is likely not going to be used for the MVP as I think we're maybe overreaching with the functionality we want (this is for allowing the agent to know what the user is currently focused on per page and keeping prompt generation very tightly locked on the task at hand).

**Acceptance Criteria**

- FocusContext contains no raw objects/global UI state.
- Assistant prompt generation is invocation-driven and deterministic.
- Streaming/tool lifecycle state is isolated from RouteContext.

---

### 5) `refactor/actions-domain-boundary` (DEFERRED pending backend merge)

**Goal:** Align action organization and trust boundaries.

**Status note**

- Deferred for now because the frontend currently has no server action modules to refactor.
- Re-entry trigger: backend merge introduces server actions plus tenant/auth context integration points.

**Includes**

- Move/align action modules to domain-first layout.
- Ensure AuthZ + tenancy validation live inside actions.
- Keep page layers exposing action keys only.
- Remove hidden mutation indirection.

**Acceptance Criteria**

- Actions follow domain-first structure and enforce authorization at source.
- Page contracts expose keys, not executable action function payloads.

---

### 6) `refactor/server-client-route-boundary` (DONE)

**Goal:** Keep server pages server-only and isolate route-hook client boundaries.

**Includes**

- Preserve server page composition with server `searchParams` as default.
- Move `usePathname` / `useSearchParams` / segment hooks into tiny client boundaries only where required.
- Wrap suspending client query boundaries in `Suspense`.

**Acceptance Criteria**

- No unnecessary `"use client"` at page roots.
- Lens/route behavior remains correct through server-first composition.

---

### 7) `test/work-route-boundary` (DONE)

**Goal:** Lock in branch 6 behavior with regression coverage.

**Includes**

- Server dashboard route-state regression tests.
- Suspense fallback + hydrated route-hook boundary tests.
- Lens propagation regression tests across navigation.

**Acceptance Criteria**

- No behavior regressions in server/client route-state boundary patterns.

---

### 8) `test/ui-shell-regression`

**Goal:** Increase UI/shell regression confidence for high-impact interaction boundaries.

**Includes**

- Behavior tests for `AppShell` layout/rail-trigger behavior across state transitions.
- Behavior tests for `ContextRail` open/close/pin flows and route-driven visibility rules.
- Behavior tests for `LensDialogControl` interaction flow and lens propagation parity.
- Targeted dashboard section interaction tests (for example, action links and key CTA behavior) to catch composition regressions without snapshot-heavy coverage.

**Acceptance Criteria**

- Regression tests exist for `AppShell`, `ContextRail`, `LensDialogControl`, and representative dashboard section interactions.
- Tests focus on user-visible behavior and route/state invariants, not implementation internals.
- `npm run test:ci` remains green with the new suite in place.

---

### 8A) `chore/premvp-hardening-pass`

**Goal:** Close the remaining pre-MVP hardening gaps discovered after the first quality pass.

**Includes**

- Coverage hardening at app/runtime boundaries:
    - Expand coverage strategy so critical `app/**` route behavior is intentionally tested (or explicitly excluded with rationale).
    - Add targeted behavior tests for `AppShell` + rail trigger/state transitions and assistant provider error/success flows.
- Placeholder and contract drift cleanup:
    - Remove `@ts-expect-error` placeholder suppression in `frameworks/soc2/type-i/page.tsx`.
    - Implement `composeFrameworksViewModel` transformation behavior or remove the placeholder abstraction.
    - Replace temporary/typoed user-facing copy in frameworks routes.
- Docs and onboarding accuracy:
    - Fix README env usage examples so imports match actual config modules.
    - Resolve broken README reference to `LICENSE.md` (add file or remove claim).

**Acceptance Criteria**

- Critical app/runtime boundaries are covered by behavior tests and enforced in CI.
- No placeholder type suppressions remain in active frameworks route surfaces.
- README/setup guidance is accurate against current repository structure.

---

### 9) `feat/settings-framework-config`

**Goal:** Provide criteria remediation destination for fail-closed states.

**Includes**

- Framework Configuration section in settings.
- SOC2 criteria status + top validation errors + fix CTA.

**Acceptance Criteria**

- Invalid criteria state has clear path to remediation.

---

### 10) `security/lens-hardening`

**Goal:** Harden URL-driven lens trust boundaries.

**Includes**

- Strict lens param validation/normalization.
- Malformed/oversized input rejection.
- Security/privacy notes for lens logging + propagation.

**Acceptance Criteria**

- Invalid lens input degrades safely without runtime errors.

---

### 11) `chore/scope-matching-contracts`

**Goal:** Document/implement FE-side structural protections against dashboard thrash.

**Includes**

- Integrate read-model assumptions into FE data access contract docs.
- Document required compound indexes and query expectations for FE consumers.
- Apply safe RSC caching/tag invalidation and alternate-scope prefetch behavior.
- Bound “all frameworks” rendering/query behavior in FE.

**Acceptance Criteria**

- Scope switching is wired as filtered read behavior (not FE recompute assumptions).
- Caching strategy is additive, not relied on as primary mitigation.

---

### 12) `chore/contracts-and-stub-switch`

**Goal:** Introduce a thin FE data-source adapter seam so route composition is decoupled from direct stub generators.

**Includes**

- Add lightweight FE-facing data adapter interfaces for current dashboard surfaces.
- Add deterministic source selection (`stub` default, backend adapter placeholder).
- Migrate covered route composition pages to adapters (no direct `lib/stubs/*` imports in those pages).
- Document this branch as seam-only; defer full runtime staging/switching framework.

**Acceptance Criteria**

- Source selection is centralized and deterministic.
- Covered route composition pages no longer import `lib/stubs/*` directly.
- No implicit shape guessing in route/component boundaries.
- No behavior regression in current stub-backed flows.

---

### 13) `feat/evidence-upload`

**Goal:** Deliver minimum viable evidence upload, attachment, and display so users can attach proof while completing work.

**Contract references**

- `docs/contracts/evidence-model-contract.md`
- `docs/contracts/evidence-attachment-display-contract.md`

**Canonical route policy for this branch**

- Use `/work/*` as canonical implementation routes.
- If `/work`, `/library`, or `/platform` labels appear in docs/copy, treat them as future IA aliases only.

**Includes**

- Evidence index surface at `/work/evidence`:
    - header, summary metrics, filter toolbar, evidence table contract
- Evidence detail surface at `/work/evidence/[evidenceId]`:
    - current version card, preview behavior (`image/*`, `application/pdf`, fallback metadata), relations, inline history
- Shared upload flow (`EvidenceUploadFlow`) with three steps:
    - file selection
    - metadata
    - review and attach
- Launch contexts and attach behavior:
    - task context (attach to task)
    - object context (attach to object)
    - library context (create unattached evidence)
- Evidence version creation and rendering in index/detail/task/object displays.
- Task detail evidence section and object supporting evidence section using the shared upload flow.
- Derived framework/control display is read-only and derived via existing mappings only.

**Explicitly Out of Scope**

- Manual control picker in upload flow.
- Control detail UX dependency.
- Framework/control browsing UX inside upload flow.
- Audit packaging / version pin workflows.
- Advanced preview/annotation tools.

**Acceptance Criteria**

- Users can upload evidence from task, object, and library contexts with one shared flow.
- Uploaded evidence appears in:
    - `/work/evidence`
    - `/work/evidence/[evidenceId]`
    - task/object attached evidence sections
- Evidence version records are created and visible in inline history.
- Preview behavior follows contract MIME rules with safe fallback.
- No flow in this branch requires control-view pages to be present.

**Testing Checklist**

- Route/page behavior tests for evidence index and detail contracts.
- Upload flow tests for all three attach contexts.
- Task/object integration tests for attached evidence list rendering.
- Contract parity check between evidence model and attachment/display docs.

---

### 13A) `feat/control-views` _(or `feat/framework-control-inspection`)_

**Goal:** Deliver control/framework inspection surfaces that consume evidence/task relationships without blocking Branch 13.

**Dependency boundary**

- Branch 13 provides evidence upload/attachment/display capability.
- Branch 13A consumes those relationships for control inspection UX.
- Branch 13A must not backflow new requirements that block 13 acceptance.

**Includes**

- Framework detail controls table.
- Control detail page.
- Readiness display at control layer.
- Evidence section on control detail (read-only at minimum).
- Task section on control detail.
- Optional evidence-to-control mapping UI as additive behavior.
- Optional control picker in evidence upload flow only if introduced as non-blocking extension.

**Explicitly Out of Scope**

- Replacing Branch 13 upload/attachment contracts.
- Requiring manual control selection for baseline evidence upload.
- Expanding into audit packaging workflows.

**Acceptance Criteria**

- Users can inspect framework controls, control readiness, and related evidence/tasks.
- Control detail can render evidence/task relationships produced by Branch 13 flows.
- Optional mapping/picker additions (if included) do not regress Branch 13 base flows.

**Testing Checklist**

- Framework controls table route tests.
- Control detail readiness/evidence/task rendering tests.
- Regression tests showing Branch 13 upload and display still pass unchanged.

---

### 14) `feat/evidence-versioning`

**Goal:** Ship basic evidence versioning and auditable evidence revision flow.

**Status:** Functionally complete on the frontend using the temporary stub/local write path. Backend persistence, real file storage, and final backend-derived read models remain deferred until backend merge/integration work.

**Includes**

- Upload new evidence versions against an existing evidence root.
- Preserve auditable version history on the evidence detail page.
- Keep current-version display and historical-version display clearly separated.
- Continue using stub-backed/local frontend behavior until backend persistence is available.

**Acceptance Criteria**

- Upload new version -> current version updates -> older versions remain visible in history.

---

### 15) `feat/objects-filtering`

**Goal:** Add in filter and sorting for objects index, and pagination.

**Includes:**

- Filtering options inline with either our framework lens (page header) or our h2 just above surface table display of objects (inline).
- Sorting options to be iconised small buttons (arrow up / down) next to appropriate column headers (open tasks, missing evidence, updated). Only one sorting option can be applied obviously, must have primary indicative color on which arrow has been applied.
- Filtering for object should just be by domain and status. Use combobox for domain (search is required with min height), and multi select component for status (small value set, multiple can be selected). Same trigger styling, same dropdown styling.
- Add pagination, keep standardised. Pagination should exist inside single component, location below table and left hand scoped.

**Acceptance Criteria**

- Filtering and sorting components are added and visually styled to my standard.
- Pagination is implemented.
- Filtering and sorting component tested
- Pagination is stress tested enough for pre-MVP confidence, with full launch-stage stress validation still required before release.

### 16) `feat/assets-domain-separation`

**Goal:** Deliver assets MVP IA and route surfaces without conflating integrations.

**Includes**

- `/assets` summary cards + framework-aware filterable table.
- `/assets/:id` posture summary, linked controls, tasks, evidence, timeline.
- Manual Add fields: name, owner, criticality, sensitivity, framework scope, coverage flags.
- Explicit separation of `/connections` vs `/assets/services` in UX and copy.
- Service/Connection linking behavior via link table contract.

**Acceptance Criteria**

- Manual add works and framework scope is visible.
- IA clearly separates assets from connections.

---

### 17) `feat/platform-controls-overview`

**Goal:** Add an aggregated global controls inspection surface under `Platform -> Controls` for cross-framework oversight without replacing scoped control views.

**Includes**

- Add a global controls route positioned as `Platform -> Controls`.
- Keep `Frameworks` and scoped control routes intact; this route must not replace `/frameworks` or nested framework control detail pages.
- Present controls as an aggregated, filterable, readiness-focused inspection surface.
- Show overall posture, missing/unmapped/broken controls, ownership state, and cross-framework oversight signals.
- Position the page around the question "which controls are broken?" rather than framework readiness.
- Keep the route inspection-only; tasks remain the execution surface for remediation work.

**Acceptance Criteria**

- Users can inspect control posture across frameworks from one aggregated controls route.
- The route clearly differentiates cross-framework oversight from framework readiness views.
- Ownership and missing-control state are visible without turning the page into a task execution surface.

---

### 18) `feat/platform-route-ui`

**Goal:** Flesh out the existing `Connections` and `Settings` routes so they feel demo-ready with coherent adapter-backed data, stronger layout structure, and styled route-local components.

**Locked connections framing**

- Connections are external systems that feed state into the platform.
- Connections are automation sources, not evidence, tasks, or library artifacts.
- They belong in the platform layer because they answer:
    - what systems are connected
    - what data can be pulled automatically
    - what automation coverage exists
    - what evidence can be generated from connected systems
- The product relationship is:
    - Connection -> sync/checks -> generated evidence -> controls -> frameworks
- The product story should read as:
    - connect systems
    - The platform pulls trusted state
    - The platform generates or refreshes attachments
    - control posture improves
- Users should not think in terms of mapping integrations to frameworks; they should think in terms of connecting a provider and getting immediate evidence automation value.
- Platform placement is canonical:
    - Frameworks
    - Controls
    - Connections
    - Settings

**Includes**

- Expand `/work/connections` beyond placeholder-level rendering into a proper stub-backed catalog/status surface.
- Expand `/work/settings` beyond placeholder-level rendering into a proper stub-backed admin/config surface.
- Add a `connections` read seam in `lib/data-source` so route composition does not import connection stubs directly.
- Add compact route contracts for `Connections` and `Settings`.
- Introduce route-local or shared styled components where needed so both routes match the quality bar of dashboard, evidence, and objects surfaces.
- Use believable stub content for connection status, sync state, health, capabilities, profile/team/settings/config state, and supporting empty/error-adjacent copy where needed.
- Connections index requirements:
    - use a lean grouped list/card layout, not a table
    - group providers into `Connected` then `Disconnected`
    - each connection card should show provider name, status, last sync, short coverage summary, and the minimum navigation/action affordance
    - connected or failing providers should navigate into detail pages for inspection
    - disconnected providers should connect directly from the index
    - keep intro copy only at page top; no global `Add connection` CTA or summary metrics
- Add connection flow requirements:
    - use dialog on desktop and drawer on mobile
    - staged flow is sufficient: Choose provider -> Authenticate -> Optional scope/config -> Success
    - back navigation between stages is allowed
    - the interaction should feel simple and productized rather than admin-heavy
- Connection detail requirements:
    - add `/work/connections/[connectionId]` as the inspection + impact surface for connected and errored connections
    - keep a single-column body aligned with other detail pages
    - sections should include Overview, Sync status, Coverage and scopes, Generated evidence, and Settings / danger zone
    - header actions should include `Sync now`, `Reconnect`, and `Disconnect`
    - scopes should be rendered in the detail page, not a modal
- Core UI principle:
    - always frame connections as quick-to-connect automation sources
    - emphasize immediate value, visible impact, and trust in generated evidence
- Keep both routes inspection/admin surfaces only; do not expand into real backend mutation flows beyond stub-backed UI affordances.

**Acceptance Criteria**

- `Connections` and `Settings` both render as intentional, styled product surfaces rather than scaffolds/placeholders.
- `/work/connections` reads as a scan-first overview page rather than a deep inspection surface.
- `/work/connections/[connectionId]` clearly communicates connection health, sync state, coverage impact, scopes, and generated evidence links.
- The add-connection flow feels simple, staged, and productized on both desktop and mobile.
- Stub data on both routes reads coherently with the rest of the product demo.
- Route structure and component styling are reviewable and consistent with the current dashboard design language.

---

### 19) `feat/tasks-route-ui`

**Goal:** Flesh out the tasks index and task detail pages so tasks become the primary execution engine of the product, with everything else framed as supporting context.

**Locked task framing**

- Tasks are actionable units of work required to satisfy controls.
- Tasks are the only place users should feel like they are doing compliance work.
- Everything else supports tasks:
    - Task -> Evidence -> Control -> Framework
    - Task -> Object / Document
    - Task -> Asset (optional)
- Final mental model is locked as:
    - Tasks = where work happens
    - Evidence = what proves the work
    - Documents = what describes the work
    - Controls = what requires the work
    - Frameworks = how work is evaluated

**Includes**

- Upgrade `/work/tasks` into a task-first work queue surface that answers `What should I do next?`, not `What exists in the system?`
- Keep the index layout locked as:
    - Header
    - Task summary strip
    - Secondary filters
    - Task list as the primary surface
- Header requirements:
    - title `Tasks`
    - supporting copy: `Your compliance work, prioritised`
    - `Create task` CTA
- Summary strip requirements:
    - show immediate work clarity with metrics such as Open, Due soon, Overdue, Completed
    - optional metric: Blocked
- Secondary filter requirements:
    - reuse the established dropdown filter pattern
    - keep filters light for MVP: Status, Owner, Control, Asset
    - framework scope should continue to be controlled through the active lens, not a separate secondary filter
    - current task count should remain visible inline with the applied-filter feedback
- Task list requirements:
    - do not use a dense table as the primary presentation
    - use structured, card-like list rows that are easy to scan
    - each row should show status, title, due date, owner, linked control, framework, and evidence count, with asset shown only when relevant
    - clicking a row should navigate to `/work/tasks/[taskId]`
- Locked task statuses:
    - `open`
    - `in_progress`
    - `blocked`
    - `completed`
    - `overdue` is derived only, not a primary persisted task state
- Upgrade `/work/tasks/[taskId]` into the strongest work surface in the app, using a single-column layout with:
    - Header
    - Task overview
    - Evidence section
    - Documents section
    - optional Assets section
    - Activity section
- Task detail header requirements:
    - show task title and supporting page context
    - keep `Mark complete` available in header actions
    - keep status, due date, and owner visible in `TaskOverview` rather than duplicating them in the header
- Task overview requirements:
    - description
    - linked control
    - framework context
- Evidence section requirements:
    - this is the primary interaction surface on the detail page
    - include `Upload evidence` CTA prominently within the section
    - list evidence items with title, version, validity, and `View` action
- Documents section requirements:
    - show supporting documents such as procedures and policies linked to the task
- Assets section requirements:
    - include only when applicable to the task
- Activity section requirements:
    - lightweight for now; enough to show recent task/evidence updates
- Task creation requirements:
    - use dialog on desktop and drawer on mobile
    - fields: Title, Description, Control, Due date, Owner
    - optional field: Asset
    - task must always be linked to a Control
- Task state to control-impact framing:
    - completed task plus valid evidence contributes to control readiness
    - open task means control work remains incomplete
    - blocked task contributes to blocked control posture
- Locked UX principles:
    - tasks are the only place users work
    - evidence upload from tasks must be frictionless
    - control and framework context must be visible but not dominant
    - task completion should feel rewarding and visibly connected to improved posture
- Locked component contracts:
    - pages: `TasksIndexPage`, `TaskDetailPage`
    - index components: `TaskSummaryStrip`, `TaskFilterToolbar`, `TaskList`, `TaskRow`
    - detail components: shared `PageHeader` + `TaskHeaderActions`, `TaskOverview`, `TaskEvidenceSection`, `TaskDocumentsSection`, `TaskAssetsSection`
    - shared: `CreateTaskDialog`
- Filtering/query-param expectations:
    - preserve lightweight URL-driven state for index filters, e.g. `status`, `owner`, `due`
    - segment-driven views such as due soon / overdue can map to explicit URL flags or normalized query params
- Empty-state requirements:
    - no tasks yet -> explain that tasks will appear when controls require work and offer `Create task`
    - no evidence in task -> explain that evidence upload is required to complete the task and offer `Upload evidence`
- Keep this branch focused on frontend route completeness and work-surface quality; do not expand into backend/server-action work.

**Acceptance Criteria**

- Tasks index clearly prioritizes next work rather than acting like a generic system inventory.
- Task rows are scannable, list-based work items rather than dense table entries.
- Task detail page is the strongest UX surface in the app and makes evidence upload the dominant action.
- Stub-backed task execution flows read coherently with linked evidence/documents/checks/framework context.
- Task creation is lightweight, control-linked, and works through dialog/drawer patterns consistent with the rest of the app.
- The task surfaces remain aligned with the task-driven UI shell decisions already documented in repo ADRs/logs.

---

### 20) `chore/stub-data-normalisation`

**Goal:** Normalize stub data and fixture realism so stub-backed dashboard, task, object, evidence, and framework-control flows read coherently under the previous product framing.

**Includes**

- Align task titles, statuses, priorities, blockers, and related objects with believable compliance workflows.
- Align evidence titles, kinds, validity windows, and attached relationships with the tasks/objects/controls they support.
- Align object summaries, domains, framework tags, markdown fixtures, and linked evidence/tasks so they do not contradict one another.
- Remove implausible or contradictory cross-entity relationships in stub-backed flows.

**Acceptance Criteria**

- Stub-backed flows read coherently across dashboard, task, object, evidence, and control inspection routes.
- Markdown artifacts and linked data feel audit/compliance credible.
- No route relies on obviously placeholder or contradictory legacy relationships from the previous product build for core demo/test flows.

### 21) `refactor/page-component-normalisation`

**Goal:** Normalize page composition and page-level styling so routes follow one consistent structure, visual rhythm, and component-placement pattern.

**Includes**

- Strip page files down to composition and move route-specific UI into route-local `_components` directories, or global `components/*` when shared.
- Ensure pages adhere to page-model composition and build appropriate context payloads for page content (stub-backed where needed).
- Normalize shared page styling between routes:
    - header spacing and action placement
    - section spacing and surface nesting
    - table/list container treatment
    - consistent use of page-level shells and surface variants
- Rename the global nav/library route from `Objects` to `Documents` and apply the rename wherever required in IA, page copy, navigation labels, and supporting docs.
- Document why the rename exists:
    - maps more cleanly to audit/compliance language
    - is more understandable across technical and non-technical user types
    - stays flexible for future document classes beyond the current "objects" terminology
- Resolve the reload flicker caused by header placeholder height mismatch.

**Acceptance Criteria**

- Active page routes follow the same structural composition pattern and component-placement rules.
- Shared page-level styling feels consistent between dashboard, task, object, evidence, and framework routes.
- Global navigation and route-facing language consistently use `Documents` instead of `Objects` where intended by the IA change, with rationale captured in docs.
- Header placeholder/reload flicker is removed.

### 22) `feat/onboarding-skeleton`

**Goal:** Add minimal onboarding skeleton for new tenants.

**Includes**

- Root chooser at `/` with explicit `Full demo dashboard` and
  `Continue onboarding` entries.
- Separate `/onboarding` single-page wizard under `(onboarding)` with:
    - framework selection
    - company context
    - optional connections indication
    - AI behaviour mode
- Temporary stub bootstrap state split:
    - cookie stores only `mode`, `onboardingCompleted`, and a compact
      allowlisted bootstrap summary
    - localStorage stores richer client-only wizard progress
    - server rendering must never depend on arbitrary serialized onboarding
      blobs
- Fresh-mode dashboard landing with setup-first ordering:
    - `First actions`
    - `Setup blockers`
    - `Setup overview`
    - `Setup areas`
- Fresh-mode starter task generation that stays at setup and baseline
  compliance level only.
- Setup-aware placeholders for non-priority routes (`Assets`, `Documents`,
  `Evidence`, `Connections`, `Settings`) so they remain reachable without
  dropping fresh users into the full demo richness.
- Temporary sidebar mode toggle for switching between `demo` and `fresh`,
  explicitly documented as removable once backend onboarding state exists.

**Decision notes**

- Region-based framework suggestion is intentionally deferred in this branch.
- Framework selection stays top-level only; SOC 2 Type I / Type II remains
  deferred and must not leak into starter-task semantics.
- Cookie state is a server-safe render branch selector, not a shadow data
  store.

**Acceptance Criteria**

- `/` always shows both entry paths and does not auto-redirect based on saved
  state.
- `/onboarding` is navigable end-to-end with no app shell and no
  assistant/context rail.
- Fresh `/work` and `/work/tasks` render from the compact bootstrap
  summary with setup-first copy and ordering.
- Starter tasks remain generic setup/baseline work and do not imply SOC 2 Type
  I / Type II audit-readiness logic.
- Non-priority routes remain reachable in fresh mode with setup-aware
  placeholder states.

---

### 23) `refactor/codebase-hardening-and-normalisation`

**Goal:** Run a deliberate late-stage cleanup pass focused on code hygiene, maintainability, implementation consistency, and hardening so the codebase is easier to operate, extend, and review.

**Includes**

- Normalize recurring implementation patterns across routes, components, adapters, and UI helpers where similar logic currently exists in slightly different forms.
- Consolidate duplicated helper logic, repeated route/query builders, and near-identical UI plumbing into clearer shared seams where doing so reduces maintenance burden.
- Refactor overly large or mixed-responsibility files into smaller units with cleaner ownership boundaries.
- Harden fragile edges in route state, payload construction, filter/query handling, and stub-backed flows where behavior is currently correct but implementation is brittle.
- Improve naming consistency, file placement consistency, and component/API ergonomics so future branches can move faster with less incidental complexity.
- Remove dead code, stale abstractions, and low-signal implementation drift introduced during rapid feature delivery.
- Document and enforce the two allowed surface composition patterns:
    - heading + description followed by one or more `SURFACE_CLASS` cards
    - full-section `SURFACE_CLASS` wrapper containing heading/description internally, with any child cards inside it limited to `SURFACE_CLASS_NESTED`
- Keep surface depth capped at two levels only:
    - top-level base surfaces
    - nested surfaces inside a base surface
- Prefer the heading + description + surface-list pattern by default, while allowing full-section cards where the UI shape requires it.
- Normalize page spacing and rhythm rules across routes:
    - `space-y-12` between major sections
    - `gap-3` between base surfaces and between description blocks and surface lists
    - `gap-1.5` only for slimmer/tighter stacked surface treatments
    - base surface padding normalized to `p-4`
    - nested surface padding normalized consistently inside parent surfaces
- Centralize these spacing/surface rules into shared styling primitives where appropriate, whether via shared constants, utility classes, or shared Tailwind abstractions.
- Normalize buttons, links, nav affordances, and heading icon patterns:
    - iconized headings/nav items render icon before text
    - dropdowns use chevrons
    - sorting buttons use inline up/down arrows
    - action buttons are generally iconized with icon after text
    - link-out / navigation affordances should sit at the bottom of the surface they pertain to and prefer link-like styling with movement icon on the right
- Move the lens dialog control into the page header in a centered/global position where it reads as page scope rather than an individual route action, with any required logic refactor kept small and behavior-preserving.
- Document the rationale for the lens-control placement so global scope controls remain clearly separated from route-specific actions.
- Reserve a late visual-tightening pass for individual components after component normalization is complete, owned by the architect rather than bundled into earlier feature branches.
- Document style choices and reusable visual patterns so normalization work leaves behind explicit UI conventions, not only code changes.
- Enforce route architecture consistency so page files remain focused on fetching data and composing the page, while route-local concerns live in `_components`, `_lib`, and related route-local directories.
- Add/normalize `_page-model` directories for active route surfaces so each page model is built, composed, validated, schema-backed, and exposed consistently.
- Ensure each page builds assistant context payloads in the same structured way, following the established `/app/(app)/work` composition pattern.
- Audit route-local `_components` for components that should be promoted to global shared `components/*`, especially repeated primitives such as stat pills, status indicators, and similar display helpers.
- Move qualifying repeated route-local UI primitives into shared component seams where doing so improves maintainability without creating premature abstraction.
- Keep this branch behavior-preserving unless a small correctness fix is required to support the hardening/refactor work.

**Acceptance Criteria**

- Core route surfaces use more consistent implementation patterns for page composition, filtering, query/state handling, and helper organization.
- Duplicated or fragmented logic is reduced where it materially improves maintainability without over-abstracting.
- Large or mixed-responsibility files targeted by this pass are split or simplified into clearer ownership boundaries.
- Known brittle implementation areas are hardened without changing intended product behavior.
- Surface/card composition is documented and applied consistently, with only the two allowed surface patterns and no surface nesting beyond two levels.
- Page spacing, section rhythm, and surface padding rules are normalized across the primary dashboard routes.
- Buttons, links, nav affordances, and heading icon usage follow one documented interaction/styling convention.
- Lens dialog placement reads as a global/page-scoped control rather than a route-specific task action, and any supporting refactor is documented.
- Post-normalization style tightening can be applied consistently because style choices and patterns are documented in an explicit repo reference.
- Active routes follow the documented page architecture:
    - pages fetch and compose
    - `_page-model` owns page-model build/validation/schema concerns
    - route-local UI stays route-local unless it is truly shared
- Repeated UI primitives that are effectively global are promoted out of route-local `_components` into shared component seams where appropriate.
- The codebase is measurably easier to navigate and modify, with no user-facing regressions introduced by the cleanup pass.

---

## Dependency Map

- 1 -> 3 -> 4 are mandatory contract foundation sequence.
- 2 can run in parallel with late 1 / early 3 and should complete before broad feature rollout to keep quality gates/docs reliable.
- 5 can run in parallel with late 3 / early 4, but must complete before contract freeze.
- 6 depends on 3 and 4.
- 7 depends on 6.
- 8 depends on 7.
- 8A depends on 6 and should complete before features that increase UI surface area.
- `feat/settings-framework-config` depends on scope/lens baseline and should land before broad onboarding.
- `security/lens-hardening` depends on lens contract baseline and should land before `chore/scope-matching-contracts`.
- `chore/scope-matching-contracts` depends on hardened lens normalization.
- `chore/contracts-and-stub-switch` and `feat/evidence-upload` depend on contract lock (1-4 + 6; 5 is deferred pending backend merge) and should complete before broader evidence/assets rollout. `chore/contracts-and-stub-switch` is intentionally a thin prerequisite seam, not a full environment-switching platform.
- `feat/control-views` depends on `feat/evidence-upload`.
- `feat/evidence-versioning` depends on `feat/evidence-upload`.
- `feat/objects-filtering` can land after `feat/evidence-upload` / `feat/control-views` and before assets work.
- `feat/platform-route-ui` can land after the current platform route scaffolds are stable and before broader onboarding/demo polish work.
- `feat/tasks-route-ui` should land before `chore/stub-data-normalisation` so task-surface needs inform the realism pass.
- `feat/assets-domain-separation` depends on `feat/evidence-versioning` and benefits from `feat/control-views`.
- `feat/platform-controls-overview` depends on `feat/control-views` and benefits from `feat/evidence-versioning` and `feat/assets-domain-separation`.
- `chore/stub-data-normalisation` depends on `feat/evidence-upload`, `feat/control-views`, `feat/evidence-versioning`, `feat/objects-filtering`, `feat/assets-domain-separation`, and `feat/platform-controls-overview`.
- `refactor/page-component-normalisation` depends on `chore/contracts-and-stub-switch`, `feat/evidence-upload`, `feat/platform-controls-overview`, and `chore/stub-data-normalisation`.
- `feat/onboarding-skeleton` depends on `feat/settings-framework-config` and `feat/evidence-upload`, and benefits from `refactor/page-component-normalisation`.
- `refactor/codebase-hardening-and-normalisation` should run late, after the main product surfaces are in place, and benefits from `refactor/page-component-normalisation` and `feat/onboarding-skeleton`.

## Canonical Tick-off Order (Revised)

1. `chore/pagemodel-lock` (DONE)
2. `chore/quality-gates-and-docs` (DONE)
3. `chore/route-context-guards` (DONE)
4. `refactor/assistant-rail-state-and-prompt` (DONE)
5. `refactor/actions-domain-boundary` _(DEFERRED pending backend merge)_
6. `refactor/server-client-route-boundary` (DONE)
7. `test/work-route-boundary` (DONE)
8. `test/ui-shell-regression` (DONE)
9. `chore/premvp-hardening-pass` (DONE)
10. `security/lens-hardening` (DONE)
11. `feat/settings-framework-config` (DONE)
12. `chore/scope-matching-contracts`
13. `chore/contracts-and-stub-switch`
14. `feat/evidence-upload`
15. `feat/control-views`
16. `feat/evidence-versioning`
17. `feat/objects-filtering`
18. `feat/assets-domain-separation`
19. `feat/platform-controls-overview`
20. `chore/stub-data-normalisation`
21. `refactor/page-component-normalisation`
22. `feat/onboarding-skeleton`
23. `refactor/codebase-hardening-and-normalisation`

## Execution Mapping (2-Week)

- Week 1 focus: branches 4-10 (through security + hardening closure before feature expansion).
- Week 2 focus: branches 11-23 with settings/lens completion first, then contracts/evidence/assets/checks/stub normalization/onboarding, ending with late-stage hardening and normalization.

## Final Non-Negotiables (No Drift)

- Pages are Server Components only.
- PageModel + RouteContext are JSON-safe, allowlisted, and size-bounded.
- No raw docs in rail payloads.
- FocusContext is pointer-only.
- Prompt is built lazily.
- Actions are domain-first with AuthZ in action.
- Framework scope is canonical in URL.
- Assets and Connections remain distinct entities and IA surfaces.
