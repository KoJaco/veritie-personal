# ADR 0002 — TaskContext Three-State System with Persistence

## Status

Accepted

## Date

2026-02-01

## Context

The TaskContext panel (right rail) needs to support multiple interaction modes to balance user productivity and screen real estate. Users need to:

- View context information while working on tasks
- Pin the context panel for persistent reference
- Temporarily overlay context without layout shift
- Have their preference persist across navigation

The panel must work responsively across desktop and mobile breakpoints, with different behaviors appropriate to each form factor.

## Decision

We implement a **three-state system** for TaskContext:

1. **CLOSED** — Panel is not visible
2. **OPEN_OVERLAY** — Panel slides in from right as non-modal overlay (desktop only)
3. **PINNED_DOCKED** — Panel occupies fixed right column, main content width reduced

State persistence uses **sessionStorage** to remember the user's pinned preference across task navigation within the same session.

### State Transitions

- `open()` — Opens as PINNED_DOCKED if previously pinned, otherwise OPEN_OVERLAY
- `close()` — Sets to CLOSED (preserves pinned preference in sessionStorage)
- `toggle()` — Opens if closed, closes if open
- `pin()` — Sets to PINNED_DOCKED and persists to sessionStorage
- `unpin()` — Sets to OPEN_OVERLAY and removes sessionStorage entry

### Responsive Behavior

- **Desktop (≥lg)**: Supports all three states (CLOSED, OPEN_OVERLAY, PINNED_DOCKED)
- **Mobile (<lg)**: Only CLOSED and OPEN states (bottom drawer), pinning not available

## Alternatives Considered

- **Two-state system (open/closed)** — Rejected because it doesn't support persistent pinned mode, which is essential for long-form task work
- **localStorage persistence** — Rejected because pinned preference should be session-scoped, not persist across browser sessions
- **No persistence** — Rejected because users expect their layout preference to persist as they navigate between tasks
- **Modal overlay** — Rejected because it blocks interaction with main content, reducing productivity

## Consequences

### Pros

- Enables efficient multi-tasking (pinned mode) and quick reference (overlay mode)
- User preference persists across navigation, improving UX
- Non-modal overlay allows continued interaction with main content
- Session-scoped persistence aligns with user expectations

### Cons

- Adds complexity to state management (three states vs two)
- Requires sessionStorage coordination between components
- Responsive behavior adds conditional rendering logic
- State transitions must handle edge cases (e.g., closing pinned state)

### Follow-ups / TODOs

- Consider adding keyboard shortcuts for pin/unpin
- Evaluate need for localStorage fallback if sessionStorage unavailable
- Monitor user feedback on overlay vs pinned usage patterns

## References

- Related ADR: `docs/adr/0001-task-driven-ui-shell.md`
- Related Contract: `docs/contracts/ui/task-context-state-contract.md`
- Related Decision: `docs/decisions/sessionstorage-persistence-strategy.md`
- Implementation: `components/task/TaskContextProvider.tsx`

