# Branch 01 - Projection Foundation and Tasks

Suggested branch: `feature/projection-foundation-tasks`

## Objective

Turn manual timeline acceptance into deterministic domain projection, starting with tasks as the first proving entity. After this branch, accepting a `task` extracted value creates or updates a durable `tasks` row, and rollback removes or detaches that projection safely.

## Depends On

- Existing capture -> timeline -> accept/reject/rollback flow.
- Existing `db/schema/objects.ts` task table.
- Existing task route/read model components.

## In Scope

- Projection service entry point for accept and rollback.
- Task projection mapper.
- Provenance and rollback lookup strategy.
- Transactional backend mutation path.
- Stub/dev mode parity where review actions still use stub adapters.
- Mobile extracted-value edit drawer footer fix.
- Basic task route unhide/populated state if the existing backend read path is sufficient.
- Tests for accept, rollback, idempotency, and edited-row protection.

## Out of Scope

- Task lists and checklist grouping.
- Reminders, goals, money, records, and resources projection.
- AI suggestions.
- Capture profile changes.

## Implementation Checklist

### Discovery

- [ ] Re-read `lib/actions/stub-data-mutations.ts`, `lib/db/repositories/timeline.ts`, and `components/extraction/ExtractedValueInlineReviewActions.tsx`.
- [ ] Confirm current backend/stub adapter split for timeline review mutations.
- [ ] Confirm task table fields against `lib/domain/task.ts` and route page-model requirements.

### Schema and Provenance

- [ ] Choose rollback lookup strategy: `projection_links` table or back-link fields on `extracted_values`.
- [ ] If using `projection_links`, add fields for `account_id`, `source_value_id`, `source_capture_id`, `entity_type`, `entity_id`, `projected_at`, and `metadata`.
- [ ] Add indexes for `source_value_id`, `(account_id, entity_type, entity_id)`, and rollback lookup.
- [ ] Add migration tests or schema snapshot updates according to repo convention.

### Projection Service

- [ ] Add `lib/capture/project-on-accept.ts` or equivalent service module.
- [ ] Expose `projectExtractedValueOnAccept(input)` and `rollbackProjectionForExtractedValue(input)`.
- [ ] Keep mapper output deterministic from `extracted_values.fields`.
- [ ] Make projection idempotent for repeated accept calls.
- [ ] Add explicit unsupported-type behavior: no-op with diagnostic, not partial mutation.
- [ ] Keep projection inside the same backend transaction as review state update.

### Task Mapper

- [ ] Map title, notes/source quote, due date, priority, aspect, source ids, and default `status: "todo"`.
- [ ] Normalize missing/invalid priority to the existing domain default.
- [ ] Preserve source quote or extraction evidence in notes/metadata if available.
- [ ] Decide whether repeated accepted values merge into an existing task or always create one task per value for branch 1.
- [ ] Record projected entity id for rollback.

### Rollback

- [ ] Delete the task when the task was solely created from the source value and has not been manually edited.
- [ ] Remove only provenance when the task has multiple source values.
- [ ] Keep the task when it was manually edited after projection, and remove the provenance link.
- [ ] Return a user-visible result that review UI can explain when rollback keeps an edited row.

### Review UI Hardening

- [ ] Fix `components/extraction/ExtractedValueEditorSheet.tsx` mobile drawer overflow so Save/Cancel actions are rendered in `DrawerFooter` or an equivalent fixed footer.
- [ ] Keep the editable fields in the scrollable drawer body while the footer remains visible/clickable.
- [ ] Match the existing `components/resources/ResourceCreateFlow.tsx` drawer/footer pattern where practical.
- [ ] Add or update a component test that opens the mobile drawer variant and verifies Save/Cancel are present outside the scrollable content region.
- [ ] Manually verify mobile edit flow from capture indexed result and timeline extracted-value review surfaces.

### Task Route

- [ ] Ensure `/tasks` reads persisted tasks for the current account and aspect lens.
- [ ] Replace any placeholder state that hides real projected tasks.
- [ ] Keep empty state when there are no tasks.
- [ ] Ensure `/tasks/[taskId]` can open a projected task without legacy `/work` paths.

### Tests

- [ ] Unit test task field mapping.
- [ ] Repository/service test accept -> task row.
- [ ] Repository/service test accept idempotency.
- [ ] Repository/service test rollback delete.
- [ ] Repository/service test rollback detach when merged.
- [ ] Repository/service test rollback keep when manually edited.
- [ ] Component or action test that accept action calls projection.
- [ ] Component test for mobile extracted-value edit drawer footer actions.
- [ ] Route/page test that projected tasks appear on `/tasks`.

## Acceptance Criteria

- Accepting a task timeline item creates exactly one task row for the account.
- Accepting the same value twice does not create duplicates.
- Rolling back an unedited single-source task removes it.
- Rolling back a manually edited task keeps the task and removes the source link.
- The timeline review state and projection state cannot diverge on transaction failure.
- Mobile extracted-value edit drawers keep Save/Cancel actions visible and clickable even when fields overflow.
- `/tasks` shows the projected task without manual refresh after navigation.

## Open Questions

- Should branch 1 always create a new task per accepted value, or attempt dedupe by title/due date?
- What is the canonical "manual edit" signal for rollback protection?
- Should `projection_links` become the standard for all entity projection, or is a back-link on `extracted_values` enough?
- Should projection failures block accept, or leave the value pending with an error? Recommended: block accept and show retryable error.
