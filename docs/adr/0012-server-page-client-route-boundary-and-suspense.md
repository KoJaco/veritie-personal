# ADR-0012: Server-Page Route State + Client Boundary for URL Hooks

## Status

Accepted

## Date

2026-02-23

## Context

We need to preserve Server Component pages in `app/**/page.tsx` while still supporting route-aware UI behaviors that rely on client hooks (`usePathname`, `useSearchParams`, `useSelectedLayoutSegment`).

Next.js guidance also requires `useSearchParams()` to be wrapped in a `Suspense` boundary when used in subtrees that may be statically rendered.

Without an explicit pattern, pages were being clientified just to read URL state.

## Decision

Adopt a server-first route state model:

-   Page routes use server `searchParams`/`params` as the default source of URL state.
-   Client route hooks are isolated to small client boundary components.
-   Any component using `useSearchParams()` is exported through `Suspense` with a lightweight loading fallback.
-   Do not mark entire route pages as client components solely for route/query checks.

## Alternatives Considered

-   **Clientify page routes** — rejected due to larger hydration surface, weaker server/data boundaries, and unnecessary client coupling.
-   **Create one global route-state provider for all URL concerns** — rejected for now; adds abstraction before proving stable shared needs.

## Consequences

-   **Pros**
-   Preserves server rendering benefits and route-level composition boundaries.
-   Reduces accidental expansion of client-only logic.
-   Makes `useSearchParams` suspension behavior explicit and safe.

-   **Cons**
-   Requires small wrapper/fallback components around hook users.
-   Temporary mixed mode while older pages are migrated incrementally.

-   **Follow-ups / TODOs** (optional)
-   Complete migration of `app/work/page.tsx` to server route composition.
-   Add regression tests for suspense-wrapped route hook components.

## References

-   Issue: TBD
-   PR: TBD
-   Related docs/contracts: `docs/contracts/scope-lens-contract.md`, `docs/contracts/route-state-boundary-contract.md`
