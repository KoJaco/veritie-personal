# Branch 05 - Goals and Habits

Suggested branch: `feature/goals-habits`

## Objective

Make `/goals` useful for outcomes, habits, and manually reviewed progress. Goal creation can be projected from accepted timeline items; goal progress requires user resolution through a picker before it updates a goal.

## Depends On

- Branch 01 projection foundation.

## In Scope

- Goal projection on accept and rollback.
- Goal progress projection with required goal picker.
- `goals.aspectIds` or equivalent multi-aspect support.
- Habit view over goals where `targetType = "habit"`.
- Manual goal create/edit/archive.
- Progress entry history.
- Basic streak/progress calculations.

## Out of Scope

- Autonomous AI goal matching.
- Complex coaching/analytics.
- Social/team goals.
- Wearable or external health integrations.

## Implementation Checklist

### Schema

- [ ] Add or migrate `goals.aspectIds` if required.
- [ ] Confirm `goal_progress_entries` supports value delta, value snapshot, note, occurred at, confidence, and provenance.
- [ ] Add indexes for active goals, target type, aspect filtering, and progress history.
- [ ] Decide how to preserve existing single `aspect` values when adding `aspectIds`.

### Projection

- [ ] Add goal mapper for title, target type, target value, unit, cadence, aspect ids, and provenance.
- [ ] Add rollback behavior for created goals.
- [ ] Add goal progress mapper that refuses to run without a selected goal id.
- [ ] Update goal current value when progress has a delta or snapshot.
- [ ] Keep progress insertion and goal update in one transaction.

### Resolution UI

- [ ] Add goal picker to timeline accept flow for `goal_progress`.
- [ ] Filter picker by active goals and current aspect lens.
- [ ] Allow "create new goal" if no match exists, if scope remains manageable.
- [ ] Preselect fuzzy title matches only as suggestions; require confirmation.

### Route UI

- [ ] Replace `/goals` placeholder.
- [ ] Add active goals list with progress summaries.
- [ ] Add habit filter/view using `targetType = "habit"`.
- [ ] Add goal detail or expandable row with progress history.
- [ ] Add manual progress entry.
- [ ] Add archive/complete actions.

### Tests

- [ ] Goal projection accept/rollback tests.
- [ ] Goal progress requires goal id.
- [ ] Goal progress updates current value correctly.
- [ ] Aspect filtering tests for single and multi-aspect goals.
- [ ] Route tests for active goals, habits, empty state, and progress history.
- [ ] Component tests for goal picker.

## Acceptance Criteria

- Accepting a goal creates a goal row with provenance.
- Accepting goal progress cannot proceed without user-selected goal.
- Goal progress updates are transactionally consistent.
- Habits appear as a filtered goal view, not a separate entity.
- Rollback behaves safely for created goals and progress entries.

## Open Questions

- Should progress rollback subtract deltas from current value or recalculate current value from remaining progress entries? Recommended: recalculate for correctness.
- Should `aspectIds` replace `aspect`, or should both exist during migration?
- Should goals support status values beyond `active`, `completed`, and `archived` initially?
- Should habit streaks be computed on read or cached?

