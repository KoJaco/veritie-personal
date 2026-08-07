# Branch 02 - Tasks and Lists

Suggested branch: `feature/tasks-lists`

## Objective

Make tasks operational: list views, checklist grouping, manual list assignment, completion, and ergonomic task management. Lists are views over tasks, not records or resources.

## Depends On

- Branch 01 projection foundation and task projection.

## In Scope

- `task_lists` registry.
- `tasks.listId` optional foreign key.
- `/tasks` list filtering and checklist view.
- Manual list create/edit/delete.
- Assign/unassign tasks to a list.
- Task completion from list rows.
- Aspect-aware filtering.
- Optional task-list launch context documented for later capture profiles, but not full profile implementation.

## Out of Scope

- Many-to-many task/list membership.
- Project management hierarchy.
- Capture profile infrastructure.
- AI list assignment.

## Implementation Checklist

### Schema

- [ ] Add `task_lists` with account id, name, kind, optional aspect, timestamps.
- [ ] Add nullable `tasks.listId`.
- [ ] Add indexes for `(account_id, list_id)`, `(account_id, kind)`, and `(account_id, aspect)`.
- [ ] Add foreign key behavior for list deletion: either set `tasks.listId = null` or block deletion when tasks exist.

### Repositories and Actions

- [ ] Add task list repository methods: list, get, create, update, archive/delete.
- [ ] Add task assignment mutation.
- [ ] Add task completion mutation that preserves provenance.
- [ ] Validate list ownership on every task assignment.
- [ ] Keep mutations account-scoped and aspect-safe.

### Route UI

- [ ] Update `/tasks` page model to include task lists and active list filter.
- [ ] Add list selector/sidebar or compact segmented control depending on existing route layout.
- [ ] Support `/tasks?list={listId}` as the initial route contract.
- [ ] Add create-list flow.
- [ ] Add assign-to-list control for task rows/detail.
- [ ] Add checklist row behavior with stable layout.
- [ ] Include empty states for no tasks, no list tasks, and archived/completed filters.

### Detail UI

- [ ] Ensure `/tasks/[taskId]` shows list membership.
- [ ] Add list assignment on detail.
- [ ] Keep linked resources/records sections working.
- [ ] Fix any remaining `/work/tasks` links encountered in touched surfaces.

### Tests

- [ ] Repository tests for list CRUD and task assignment.
- [ ] Account isolation tests for cross-account assignment attempts.
- [ ] Page model tests for all-tasks and list-filtered tasks.
- [ ] Component tests for list selector, task row completion, and assignment.
- [ ] Manual E2E: accept task -> assign to list -> complete -> rollback accepted value.

## Acceptance Criteria

- Users can create a list and add projected/manual tasks to it.
- `/tasks?list={id}` shows only tasks on that list.
- Completing a task does not break projection provenance.
- Deleting/archiving a list has a defined and tested effect on member tasks.
- The route stays useful with zero, one, and many lists.

## Open Questions

- Should deletion archive lists by default instead of hard deleting?
- Should list kind be limited to `checklist` and `project` initially?
- Should completed tasks remain visible in list views behind a toggle?
- Should task-list capture profile launch from list detail wait until Branch 09? Recommended: yes.

