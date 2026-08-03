# ADR 0005 — Sidebar Header + Footer Responsibilities

## Status

Accepted

## Date

22-01-2026

## Context

The sidebar requires clear separation of responsibilities between its header and footer sections. Different UI elements serve different purposes and have different interaction frequencies:

- **Logo/product mark**: High-frequency navigation (users click to return home)
- **Tenant/workspace switching**: Low-frequency, high-impact action (users rarely switch but it's critical when needed)

Placing tenant switching in the header would clutter a high-traffic area with an infrequently used control.

## Decision

### SidebarHeader Responsibilities

The `SidebarHeader` component contains:
- **Logo / product mark**: Visual brand identifier
- **Logo click behavior**: Navigates to `/work` (primary work area)
- **No tenant switching**: Tenant/workspace selector does not belong in the header

### SidebarFooter Responsibilities

The `SidebarFooter` component contains:
- **Tenant/workspace selector**: Placeholder for tenant/workspace switching functionality
- **Rationale**: Infrequent, high-impact action belongs in footer where it doesn't compete with primary navigation

## Rationale

- **Header for frequent actions**: Logo navigation is a common, frequent action that belongs in the header
- **Footer for infrequent actions**: Tenant switching is rare but critical, making footer placement appropriate
- **Visual hierarchy**: Separating logo (brand/identity) from tenant selector (configuration) improves clarity
- **Consistent patterns**: Follows common SaaS patterns where workspace/tenant switching is in footer or user menu

## Alternatives Considered

- **Tenant selector in header** — Rejected because it competes with primary navigation and clutters a high-traffic area
- **Tenant selector in user menu (header)** — Rejected because tenant switching is workspace-level, not user-level, and belongs in the sidebar context
- **No tenant selector in MVP** — Rejected because placeholder is needed to reserve space and communicate future functionality
- **Logo in footer** — Rejected because logo is a primary navigation element and brand identifier that belongs in header

## Consequences

### Pros

- Clear separation of concerns between header and footer
- Logo navigation is easily accessible
- Tenant selector doesn't interfere with primary navigation
- Follows established UX patterns
- Footer placement reserves space for future functionality

### Cons

- Footer placement may be less discoverable for tenant switching
- Requires users to scroll to footer on mobile (though footer is sticky)
- May need to reconsider if tenant switching becomes more frequent

### Follow-ups / TODOs

- Implement tenant/workspace selector placeholder in SidebarFooter
- Monitor user feedback on tenant selector discoverability
- Consider user menu placement if tenant switching becomes more frequent

## References

- Related ADR: `docs/adr/0004-sidebar-information-architecture-mvp.md`
- Related ADR: `docs/adr/0006-header-top-bar-mvp-scope.md`
- Implementation: `components/static/sidebar/SidebarHeader.tsx`, `components/static/sidebar/SidebarFooter.tsx`
- Spec: `docs/todo.md` Section 1 (ADRs to Write)

