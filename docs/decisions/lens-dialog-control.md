# Decision Note: Lens Dialog Control as Primary UX

## Date

2026-02-22

## Summary

Adopt a compact header indicator button (`Lens: ...`) that opens a single-screen dialog for lens editing, while keeping inline switcher components available as an alternative pattern.

## Decision

Use dialog-driven lens controls on lens-relevant pages, with conditional sections for operating scope and delivery-observability window/date range when applicable.

## Rationale

- Keeps page chrome cleaner than always-visible inline controls.
- Makes current lens state explicit via a persistent indicator label.
- Preserves progressive disclosure without introducing a multi-step wizard.
- Reuses one control pattern across index and detail pages.

## Impact

- Affects dashboard route headers and lens interaction flow.
- Standardizes “Apply/Cancel/Reset” behavior for lens changes.
- Keeps URL-based lens contract intact (dialog applies via URL helpers).

## Follow-ups

- [ ] Evaluate whether scope detail pages should use `windowOnly` inline controls instead of dialog.
- [ ] Validate accessibility and keyboard flows for dialog interactions.

## References

- Issue: #
- PR: #
- Related ADR/Contracts: `docs/adr/0010-framework-lens-url-contract.md`, `docs/contracts/scope-lens-contract.md`
