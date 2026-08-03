# Decision Note: Detail Header Owns Primary Attachment Actions

## Date

2026-03-27

## Summary

Place primary attachment actions for task and document detail routes in `PageHeader.actions`, while attachment sections remain focused on displaying current related attachment state.

## Decision

Task detail and document detail pages expose upload/attach actions in the page header. Attachment list sections inside the page body are display-oriented and render the current relationship state rather than owning the primary CTA cluster.

## Rationale

- Keeps primary actions in a predictable location across detail routes.
- Reduces duplication between section-level controls and page-level intent.
- Makes attachment sections easier to scan as state/relationship surfaces rather than mixed action panels.
- Aligns with current route composition using shared `PageHeader` instead of route-specific header components.

## Impact

This affects task/document detail page composition, attachment section responsibilities, and the documentation of attachment behavior across task/document routes.

## Follow-ups

- [ ] Apply the same action-placement rule consistently when additional detail routes gain attachment actions.
- [ ] Revisit section-level secondary actions only when a route has attachment-specific local workflows that do not belong in page header chrome.

## References

- Issue: #
- PR: #
- Related ADR/Contracts: `docs/contracts/attachments-embedded-display-contract.md`
