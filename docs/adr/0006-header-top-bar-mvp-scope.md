# ADR 0006 — Header (Top Bar) MVP Scope

## Status

Accepted

## Date

22-01-2026

## Context

The top header bar serves as the global navigation and utility area for the platform. In MVP, we must establish clear boundaries for what belongs in the header versus what is deferred to future releases.

Key considerations:
- Header should be platform-owned and task-agnostic (doesn't depend on task context)
- Breadcrumbs are a common navigation pattern but add complexity
- Global search is desired but backend feasibility is unknown
- Header must work across all screen sizes

## Decision

The `AppHeader` (top bar) in MVP contains **exactly**:

1. **Sidebar toggle button**: Opens/closes sidebar on mobile (<xl breakpoint)
2. **Current section label**: Displays the current area (Work, Documents, Evidence, Connections, Settings)
3. **Global search placeholder**: Non-functional placeholder, clearly marked as "pending feasibility" (see ADR 0007)
4. **Notifications stub**: Placeholder button for notifications (non-functional)
5. **User menu stub**: Placeholder button for user account menu (non-functional)

**Explicitly excluded from MVP:**
- **No breadcrumbs**: Breadcrumb navigation is deferred to future releases
- **No task-specific content**: Header is platform-owned and task-agnostic

## Rationale

- **Platform-owned**: Header doesn't depend on task context, making it stable and predictable
- **Task-agnostic**: Header remains consistent regardless of what task or content is displayed
- **No breadcrumbs in MVP**: Reduces complexity; current section label provides sufficient context
- **Placeholder approach**: Reserves space for future functionality (search, notifications, user menu) without requiring full implementation
- **Responsive design**: Header adapts to screen size but maintains core functionality

## Alternatives Considered

- **Include breadcrumbs in MVP** — Rejected because current section label provides sufficient context, and breadcrumbs add complexity without clear MVP benefit
- **Functional search in MVP** — Rejected because backend feasibility is unknown and partial/fake search behavior is explicitly prohibited (see ADR 0007)
- **No search placeholder** — Rejected because placeholder reserves space and communicates future functionality
- **Task-specific header content** — Rejected because header is platform-owned and task-agnostic; task-specific content belongs in TaskShell
- **Full notifications/user menu implementation** — Rejected because MVP focuses on shell structure, not full feature implementation

## Consequences

### Pros

- Clear, locked scope prevents scope creep
- Platform-owned header ensures consistency
- Placeholders communicate future functionality
- No breadcrumbs reduces complexity
- Responsive design supports all screen sizes

### Cons

- No breadcrumbs may limit navigation context in complex workflows
- Placeholders may create user expectations for functionality that isn't ready
- Current section label may be insufficient for deeply nested routes (not applicable in MVP)

### Follow-ups / TODOs

- Implement search placeholder with "pending feasibility" marking (see ADR 0007)
- Monitor user feedback on navigation context needs
- Plan breadcrumb implementation for future release if needed
- Implement functional notifications and user menu in future releases

## References

- Related ADR: `docs/adr/0003-responsive-shell-behavior.md`
- Related ADR: `docs/adr/0007-global-search-placeholder.md`
- Related ADR: `docs/adr/0001-task-driven-ui-shell.md`
- Implementation: `components/static/AppHeader.tsx`
- Spec: `docs/todo.md` Section 1 (ADRs to Write) and Section 2 (Top Header Components)

