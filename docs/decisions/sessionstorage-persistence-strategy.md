# Decision Note: SessionStorage Persistence Strategy for TaskContext

## Date

2026-02-01

## Summary

We use browser `sessionStorage` to persist the TaskContext pinned preference across task navigation within the same browser session. This allows users to maintain their preferred layout (pinned vs overlay) as they move between tasks, improving productivity and UX consistency.

## Decision

TaskContext `PINNED_DOCKED` state is persisted to `sessionStorage` using the key `"taskContextState"`. The persisted value is checked on component initialization and when opening the context panel. The persistence is session-scoped (cleared when browser tab closes), not permanent.

## Rationale

- **Session-scoped preference**: Pinned layout preference is contextual to a work session, not a permanent user setting
- **Survives navigation**: Users expect their layout preference to persist as they navigate between tasks
- **No server round-trip**: Client-side persistence avoids API calls and enables instant state restoration
- **Privacy-friendly**: SessionStorage is cleared on tab close, avoiding privacy concerns
- **Graceful degradation**: If sessionStorage is unavailable, the feature degrades gracefully (no persistence, no crash)

## Impact

- **User Experience**: Users maintain preferred layout across task navigation
- **State Management**: Adds sessionStorage coordination to TaskContextProvider
- **Testing**: Requires mocking sessionStorage in unit tests
- **Browser Support**: Relies on sessionStorage API (widely supported, but requires fallback handling)

## Follow-ups

- [ ] Consider adding localStorage option for "remember preference" user setting
- [ ] Monitor sessionStorage quota usage if storing additional state
- [ ] Document fallback behavior if sessionStorage unavailable

## References

- Related ADR: `docs/adr/0002-task-context-state-management.md`
- Related Contract: `docs/contracts/ui/task-context-state-contract.md`
- Implementation: `components/task/TaskContextProvider.tsx`

