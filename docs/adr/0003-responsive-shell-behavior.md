# ADR 0003 — Responsive Shell Behavior with Component-Specific Breakpoints

## Status

Accepted

## Date

2026-02-01

## Context

The task-driven UI shell must work effectively across desktop and mobile devices. Different components have different interaction patterns and space requirements:

- **AppSidebar**: Navigation structure that benefits from persistent visibility on desktop
- **TaskContext**: Context panel that needs different presentation on mobile vs desktop
- **AppHeader**: Must accommodate mobile menu toggle and responsive search

A single breakpoint strategy would force compromises in UX for some components.

## Decision

We adopt **component-specific breakpoints**:

- **AppSidebar**: Uses `xl` breakpoint (1280px)
  - Desktop (≥xl): Always visible fixed sidebar
  - Mobile (<xl): Sheet component (drawer from left)
  
- **TaskContext**: Uses `lg` breakpoint (1024px)
  - Desktop (≥lg): Supports overlay and pinned states (Sheet overlay, div pinned)
  - Mobile (<lg): Bottom drawer only (Drawer component, no pinning)

- **AppHeader**: Uses multiple breakpoints
  - Menu toggle: `<xl` (matches sidebar)
  - Search input: `<md` hidden, `≥md` visible
  - Area label: `<sm` hidden, `≥sm` visible

### Implementation Details

- Breakpoints are defined in Tailwind CSS configuration
- Components detect breakpoints via JavaScript (`window.innerWidth`) for conditional rendering
- CSS classes handle responsive styling (e.g., `hidden xl:block`)

## Alternatives Considered

- **Single breakpoint (e.g., `md` or `lg`)** — Rejected because sidebar and context panel have different optimal breakpoints based on their content and interaction patterns
- **No responsive behavior** — Rejected because mobile users need accessible navigation and context access
- **CSS-only responsive (no JS detection)** — Rejected because TaskContext needs conditional rendering logic for mobile vs desktop states

## Consequences

### Pros

- Each component can optimize for its specific use case
- Better UX on both desktop and mobile
- Follows mobile-first responsive design principles
- Aligns with Tailwind CSS breakpoint conventions

### Cons

- Multiple breakpoints to remember and maintain
- Requires JavaScript for some responsive behaviors (TaskContext mobile detection)
- More complex CSS class combinations
- Potential inconsistency if breakpoints drift over time

### Follow-ups / TODOs

- Document breakpoint strategy in design system
- Consider extracting breakpoint constants to shared config
- Monitor for breakpoint inconsistencies as components evolve

## References

- Related ADR: `docs/adr/0001-task-driven-ui-shell.md`
- Related ADR: `docs/adr/0002-task-context-state-management.md`
- Implementation: `components/static/AppSidebar.tsx`, `components/task/TaskContext.tsx`, `components/static/AppHeader.tsx`

