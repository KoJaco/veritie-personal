# ADR 0004 — Sidebar Information Architecture (MVP)

> **Historical note:** Written during previous product framing. Current implementation uses domain-agnostic Work vocabulary. Retired route labels below describe original MVP navigation, not current surfaces.

## Status

Accepted

## Date

22-01-2026

## Context

The MVP static shell requires a clear, locked navigation structure in the sidebar. The platform is task-driven and aggregation-first, meaning users primarily interact with tasks and aggregated views rather than navigating through domain-specific hierarchies.

Early design decisions must prevent:
- Navigation complexity that obscures the task-driven workflow
- Premature domain explosion (e.g., separate Compliance, Risk, Audit sections)
- Per-connection navigation that fragments the user experience

## Decision

The sidebar navigation is organized into flat groups under the dashboard IA:

### Work Group
- **Tasks** → `/work/tasks`

### Library Group
- **Assets** → `/work/resources`
- **Documents** → `/work/documents`
- **Evidence** → `/work/evidence`

### Platform Group
- **Frameworks** → `/work/scopes`
- **Controls** → `/work/controls`
- **Connections** → `/work/connections`
- **Settings** → `/work/settings`

**Constraints:**
- No dropdowns or sub-items
- No nested sub-items or dropdown navigation
- No per-connection navigation in MVP
- Navigation items are flat and direct

## Rationale

- **Task-driven workflow**: Users optimize for task execution, not navigation hierarchies
- **Aggregation-first platform**: The platform aggregates work across connections rather than requiring per-connection navigation
- **MVP scope**: Prevents premature domain explosion that would complicate the core workflow
- **Simplicity**: Flat navigation reduces cognitive load and supports quick access to core areas

## Alternatives Considered

- **Domain-specific groups (Compliance, Risk, Audit)** — Rejected because MVP focuses on task execution (must discuss this for direction!), not domain navigation. Domain-specific views can be added later if needed.
- **Per-connection navigation** — Rejected because the platform aggregates work across connections. Per-connection navigation would fragment the user experience and contradict the aggregation-first model.
- **Hierarchical navigation with dropdowns** — Rejected because flat navigation reduces complexity and supports the task-driven workflow. Dropdowns add interaction overhead without clear benefit in MVP.
- **Dedicated `/work/platform/*` hierarchy** — Rejected for now because the existing flat Platform destinations already fit the product IA and avoid a broader route migration.

## Consequences

### Pros

- Clear, predictable navigation structure
- Supports task-driven workflow
- Prevents premature complexity
- Easy to extend later if needed
- Consistent with aggregation-first platform model

### Cons

- May feel limited if users expect domain-specific navigation
- Requires discipline to keep new destinations additive and flat
- Future domain-specific features may require navigation restructuring

### Follow-ups / TODOs

- Monitor user feedback on navigation structure
- Document process for adding navigation items post-MVP
- Consider navigation expansion strategy for future releases

## References

- Related ADR: `docs/adr/0001-task-driven-ui-shell.md`
- Related ADR: `docs/adr/0005-sidebar-header-footer-responsibilities.md`
- Implementation: `components/static/AppSidebar.tsx`, `components/static/sidebar/SidebarGroup.tsx`, `components/static/sidebar/SidebarItem.tsx`
- Spec: `docs/todo.md` Section 2 (Component Scaffolding)
