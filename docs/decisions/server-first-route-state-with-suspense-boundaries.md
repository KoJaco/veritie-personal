# Decision Note: Server-First Route State with Suspense Hook Boundaries

## Date

2026-02-23

## Summary

Route pages should remain server-rendered, using server `searchParams`/`params` by default. Client route hooks are allowed only inside small client boundaries, and `useSearchParams()` consumers must be wrapped in `Suspense` with a loading fallback.

## Decision

Use a server-first URL state approach and isolate client route hook usage behind `Suspense` wrappers.

## Rationale

-   Preserves Server Component boundaries for page routes.
-   Aligns with Next.js behavior for `useSearchParams()` suspension.
-   Keeps hydration scope minimal and predictable.
-   Avoids clientifying page files for simple route checks.

## Impact

-   Affects route composition patterns in Work route pages.
-   Affects shared UI components using route hooks (`LensDialogControl`, `LensSwitcher`, `AppHeader`, `SidebarHeader`, `SidebarItem`).
-   Improves resilience for static/streamed rendering paths.

## Follow-ups

-   [ ] Convert `app/work/page.tsx` to server composition (remove page-level `useSearchParams`).
-   [ ] Add test coverage for suspense-wrapped route hook components and lens behavior parity.

## References

-   Issue: TBD
-   PR: TBD
-   Related ADR/Contracts: `docs/adr/0012-server-page-client-route-boundary-and-suspense.md`, `docs/contracts/route-state-boundary-contract.md`
