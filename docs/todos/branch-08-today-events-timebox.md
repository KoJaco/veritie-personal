# Branch 08 - Today, Events, and Timebox

Suggested branch: `feature/today-events-timebox`

## Objective

Create the daily operating surface for the app. `/today` should compose actionable state from tasks, reminders, goals/habits, and interim event handling. Timeboxing remains a workflow over tasks, not a new domain entity.

## Depends On

- Branch 01 projection foundation.
- Branch 02 tasks/lists.
- Branch 04 reminders for useful reminder sections.
- Branch 05 goals/habits for habit/progress sections.

## In Scope

- `/today` route.
- Today read model composed from due/scheduled tasks, active/overdue reminders, and habits due today.
- Timebox day grid using `tasks.scheduledFor` and `scheduledDurationMin`.
- Drag/drop or explicit schedule controls for tasks.
- Interim `event_detected` handling as reminders or scheduled tasks.
- Decision on whether Today becomes default landing after launch.

## Out of Scope

- External calendar sync.
- Dedicated `events` table unless product decision changes.
- Complex recurring calendar events.
- Full calendar month/week views.

## Implementation Checklist

### Schema

- [ ] Add `tasks.scheduledDurationMin`.
- [ ] Add indexes for scheduled tasks by account/date.
- [ ] Confirm reminders expose due/overdue read model fields from Branch 04.
- [ ] Avoid adding `events` table unless a separate decision is made.

### Read Model

- [ ] Build Today page model that composes tasks due today, tasks scheduled today, overdue tasks, reminders due/overdue, and habits due.
- [ ] Respect aspect lens.
- [ ] Keep data fetching bounded for initial page load.
- [ ] Define timezone behavior from account/user/browser settings.

### Timebox UI

- [ ] Add day grid with stable slots.
- [ ] Allow scheduling unscheduled tasks into a time slot.
- [ ] Allow resizing or editing duration if feasible; otherwise use explicit duration controls.
- [ ] Allow clearing scheduled time.
- [ ] Keep task completion available from the grid.
- [ ] Provide accessible non-drag controls for scheduling.

### Event Interim Handling

- [ ] Keep `/events` placeholder or redirect documented until an events table exists.
- [ ] Map `event_detected` accept to either reminder or scheduled task through explicit user choice if ambiguous.
- [ ] Label calendar-like items clearly so users do not mistake them for external calendar sync.

### Route and Navigation

- [ ] Add `/today` route.
- [ ] Decide whether to add Today to primary nav.
- [ ] Decide whether authenticated app root should redirect to `/today` after this branch.
- [ ] Add empty states for no scheduled work and no reminders.

### Tests

- [ ] Page model tests for Today composition.
- [ ] Timezone boundary tests.
- [ ] Scheduling mutation tests.
- [ ] Timebox component tests for schedule/clear/complete.
- [ ] Event interim accept tests if implemented.

## Acceptance Criteria

- `/today` gives a useful daily view without requiring AI.
- Tasks can be scheduled into time blocks and unscheduled.
- Reminders due/overdue are visible.
- Habits due today are visible if Branch 05 has landed.
- Event handling remains honest: no external calendar behavior is implied.

## Open Questions

- Should `/today` become the default landing once shipped?
- Should timeboxing live as a tab inside `/today` or a sibling `/timebox` route?
- Should `event_detected` require a choice between reminder and scheduled task during accept?
- What timezone source is authoritative for due-today calculations?

