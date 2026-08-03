# ADR-0001: Dark Mode Implementation

> **Historical note:** Written during previous product framing. Current implementation uses domain-agnostic Work vocabulary.

## Status

Accepted

## Date

30-01-2026

## Context

The platform needs to support both light and dark themes to accommodate user preferences and improve accessibility during extended use. Dark mode is particularly valuable for:

- Reduced eye strain during long sessions reviewing policies, controls, and compliance documentation
- Adaptability to different working environments (low-light settings, security operations centers)
- Meeting modern user experience expectations
- Supporting users with light sensitivity

The platform is built with Next.js 16 and React 19, and uses Tailwind CSS for styling. The `next-themes` library was already available as a dependency.

Key requirements:
- SSR-safe theme switching (avoid hydration mismatches)
- System theme detection and fallback
- Theme persistence across sessions
- Visual consistency across all components

## Decision

Implement dark mode using `next-themes` with the following approach:

1. **Theme System:** Use `next-themes` for SSR-safe theme management with localStorage persistence
2. **Theme Provider:** Wrap the application root with `ThemeProvider` to enable context-based theme access
3. **Three Theme Options:** Light, Dark, and System (auto-detect based on OS preference)
4. **Theme Toggle:** A compact, rounded toggle button component in the sidebar footer for easy access
5. **Visual Feedback:** Active theme button is highlighted to provide clear visual indication
6. **Component Pattern:** Map through a configuration array for maintainability and extensibility

The implementation follows the component-based architecture already established in the codebase, integrating seamlessly with the existing AppShell and AppSidebar components.

## Alternatives Considered

- **CSS-only media query approach** — rejected because it provides no user control and doesn't allow theme persistence
- **Custom theme context implementation** — rejected because `next-themes` solves the SSR hydration issue and provides battle-tested persistence
- **Single light/dark toggle without system option** — rejected because system preference detection is expected behavior and provides the best default experience for most users

## Consequences

### Pros
- Users can choose their preferred viewing mode for extended document review
- System theme detection provides optimal defaults
- SSR-safe implementation prevents hydration errors
- Simple, maintainable component pattern with extensibility for future theme options
- Lightweight implementation with minimal runtime overhead
- Follows modern UX expectations

### Cons
- Requires ensuring all components support both themes (Tailwind's `dark:` prefix must be used consistently)
- Additional CSS bundle size from dark mode variants (mitigated by Tailwind's JIT mode)
- Theme preference is stored per device/browser (by design for privacy)

### Follow-ups / TODOs
- Audit all existing components for dark mode compatibility
- Consider adding keyboard shortcuts for theme switching
- Document component styling guidelines for dark mode support in design system

## References

- Issue: feat/darkmode
- Related docs: `docs/decisions/sessionstorage-persistence-strategy.md`
- Implementation: `components/theme/theme-provider.tsx`, `components/theme/mode-toggle.tsx`
