# Domain Buildout Branch Index

## Purpose

Break the app buildout into branch-sized units that can be reviewed, tested, and merged without mixing unrelated risks. These checklists implement the route and component expansion described in:

- [`docs/planning/2026-08-07-domain-projection-and-capture-surfaces-plan.md`](../planning/2026-08-07-domain-projection-and-capture-surfaces-plan.md)
- [`docs/architecture/domain-projection-and-capture-surfaces.md`](../architecture/domain-projection-and-capture-surfaces.md)
- [`docs/planning/2026-08-07-capture-completion-job-queue-plan.md`](../planning/2026-08-07-capture-completion-job-queue-plan.md)

## Branch Rules

- Keep each branch mergeable on its own.
- Prefer a vertical slice with real user value over broad schema churn.
- Keep migrations minimal and reversible through follow-up migrations, not destructive edits.
- Preserve the capture -> timeline -> accept/reject/rollback behavior on every branch.
- Projection branches must include backend and stub/dev parity where the app still supports both.
- Route UI branches must include empty, loading, error, and populated states.
- Mobile drawer actions must live in a `DrawerFooter` or equivalent fixed footer, not inside scrollable drawer content; Save/Cancel must remain clickable when content overflows.
- Do not add autonomous AI organization until manual projection and rollback are proven.

## Recommended Stack

| Order | Branch | Depends on | Outcome |
| --- | --- | --- | --- |
| 1 | `feature/projection-foundation-tasks` | Current timeline review flow | Accepted task values create/rollback task rows |
| 2 | `feature/tasks-lists` | Branch 1 | Tasks become usable checklists and lightweight lists |
| 3 | `feature/capture-completion-queue` | Current voice capture flow | Post-transcript capture completion survives closed tabs |
| 4 | `feature/reminders-push-delivery` | Branches 1 and 3 | Reminders notify through PWA push and show overdue fallback |
| 5 | `feature/goals-habits` | Branch 1 | Goals and goal progress are manually reviewable and usable |
| 6 | `feature/money` | Branch 1 | Money entries are projected, reviewed, edited, and filterable |
| 7 | `feature/records-resources` | Branch 1 | Records become personal knowledge; resources accept/merge from timeline |
| 8 | `feature/today-events-timebox` | Branches 1, 2, 4, 5 | Today composes tasks/reminders/goals and adds timeboxing |
| 9 | `feature/capture-profiles` | Branches 1 and 7 | Profiles route captures to cleaner review surfaces, braindump first |
| 10 | `feature/ai-suggestions` | Manual projection branches | AI suggests matches/merges without auto-accepting |

## Cross-Branch Invariants

- Every projected domain row keeps provenance through `source_capture_ids` and `source_value_ids`.
- Rollback from confirmed to pending either deletes the projected row or removes only the source link when the row has been edited or merged.
- Review UI remains immediate and deterministic; AI may suggest but must not silently commit.
- Background work that affects user-visible state must be durable before the browser is allowed to become irrelevant.
- Aspect lens behavior must remain consistent across timeline, tasks, records, resources, goals, money, reminders, and Today.

## Shared Verification

- `npm run typecheck`
- Relevant unit/integration tests for touched modules
- Route-level tests for server components and page model builders
- Manual capture -> timeline -> accept -> route projection flow
- Rollback flow for any projected entity
- Empty/loading/error/populated UI states for any new route surface
- Mobile drawer overflow check for every create/edit drawer touched by the branch

## Product Questions Ledger

These questions should not block branch documentation, but they should be resolved before or during the relevant branch.

| Question | Relevant branch |
| --- | --- |
| Should projection back-links live on `extracted_values` or in a `projection_links` table? | Branch 1 |
| What counts as "manually edited" for rollback protection: `updated_at > projected_at`, explicit `manual_edit_version`, or audit events? | Branch 1 |
| Should task lists have detail routes (`/tasks/lists/[id]`) or stay query-driven (`/tasks?list=`) initially? | Branch 2 |
| Should the DB-backed queue become a generic table or start as capture-specific then factor later? | Branch 3 |
| What notification content is acceptable on lock screens for private reminders? | Branch 4 |
| Should money entries support planned bills as reminders, money rows, or both? | Branch 6 |
| Should records support append-on-accept in the first records branch or only new records? | Branch 7 |
| Does Today become the default app landing once it exists? | Branch 8 |
| Should profile selection live in the global launcher first or only contextual route launchers? | Branch 9 |
