# ADR 0007 — Global Search Placeholder

## Status

Accepted

## Date

22-01-2026

## Context

Global search is a desired feature for the platform, but backend feasibility and implementation approach are unknown. The MVP static shell needs to reserve space for search functionality while being explicit about its non-functional state.

Key constraints:
- Backend search capabilities are not yet defined
- Partial or fake search behavior would create false expectations
- Search UI placement in header is established, but functionality is deferred
- Decision on search implementation is gated on backend readiness meeting

## Decision

The global search component in the header is implemented as a **non-functional placeholder** with the following requirements:

1. **Visual placeholder**: Search input UI is present in header (center slot)
2. **Clearly marked as "pending feasibility"**: Tooltip, disabled state, or visual indicator communicates that search is not yet functional
3. **No partial behavior**: No fake search results, no autocomplete, no click handlers that simulate search
4. **Decision gated**: Search functionality implementation is deferred until backend readiness is confirmed

**Implementation requirements:**
- Placeholder is disabled or non-interactive
- Tooltip or label indicates "pending feasibility" or "coming soon"
- No search behavior (no API calls, no results, no navigation)
- Reserved space communicates future functionality

## Rationale

- **Honest communication**: Placeholder clearly communicates non-functional state, preventing user frustration
- **Space reservation**: Reserves UI space for future search functionality
- **No false expectations**: Explicitly non-functional prevents users from expecting search to work
- **Backend gating**: Decision deferred until backend capabilities are understood
- **MVP scope**: Shell structure is complete without requiring full search implementation

## Alternatives Considered

- **No search placeholder** — Rejected because it doesn't reserve space and doesn't communicate future functionality
- **Partial/fake search behavior** — Rejected because it creates false expectations and violates MVP principle of honest communication
- **Functional search with mock data** — Rejected because mock data doesn't represent real backend capabilities and may mislead stakeholders
- **Remove search from MVP entirely** — Rejected because placeholder communicates future functionality and reserves space in the design

## Consequences

### Pros

- Reserves space for future search functionality
- Clearly communicates non-functional state
- Prevents user frustration from expecting functional search
- Allows shell structure to be complete without backend dependency
- Honest about MVP limitations

### Cons

- Placeholder may create user expectations for functionality that isn't ready
- Disabled/non-interactive element may feel like dead UI
- Requires clear communication to prevent confusion
- May need to be removed if search is significantly delayed

### Follow-ups / TODOs

- Mark search placeholder with "pending feasibility" indicator in implementation
- Schedule backend readiness meeting to determine search implementation approach
- Document search requirements for backend team
- Plan search functionality implementation post-MVP
- Consider removing placeholder if search is significantly delayed

## References

- Related ADR: `docs/adr/0006-header-top-bar-mvp-scope.md`
- Related ADR: `docs/adr/0003-responsive-shell-behavior.md`
- Implementation: `components/static/AppHeader.tsx`
- Spec: `docs/todo.md` Section 1 (ADRs to Write) and Section 6 (Merge Acceptance Criteria)
