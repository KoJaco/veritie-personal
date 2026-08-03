# Decision Note: Non-Modal Overlay Behavior for TaskContext

## Date

2026-02-01

## Summary

TaskContext overlay mode (OPEN_OVERLAY state) is implemented as a non-modal overlay that does not block interaction with the underlying main content. Users can continue working on tasks while viewing context information, improving productivity and workflow efficiency.

## Decision

When TaskContext is in `OPEN_OVERLAY` state, it renders as a Sheet component with `modal={false}` and `nonModal={true}` prop. The overlay has a transparent background (`bg-transparent`) and `pointer-events-none` on the overlay element, allowing clicks to pass through to the main content. The panel itself remains interactive.

## Rationale

- **Productivity**: Users can reference context while continuing to work on tasks
- **Flexibility**: Supports quick reference without committing to pinned layout
- **User Control**: Users can close via ESC key or close button, maintaining control
- **Consistent with task workflows**: Users often need to reference multiple sources while completing tasks

## Impact

- **User Experience**: Enables multi-tasking and parallel information consumption
- **Component Implementation**: Requires custom Sheet component modifications (`nonModal` prop)
- **Interaction Patterns**: Users must understand overlay doesn't block interaction (may require UX education)
- **Accessibility**: Overlay must be keyboard-dismissible (ESC key) and screen-reader accessible

## Follow-ups

- [ ] Consider adding visual indicator that overlay is non-modal (tooltip or help text)
- [ ] Evaluate need for "lock overlay" option to make it modal temporarily
- [ ] Monitor user feedback on overlay interaction patterns

## References

- Related ADR: `docs/adr/0002-task-context-state-management.md`
- Related Contract: `docs/contracts/ui/task-context-state-contract.md`
- Implementation: `components/task/TaskContext.tsx`, `components/ui/sheet.tsx`

