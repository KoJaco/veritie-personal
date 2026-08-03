# Architecture — Route State Boundary Flow

## Purpose

Describe the runtime flow for URL state across server pages and client hook boundaries, including suspense handling for query-hook consumers.

## Scope

Covered:

-   `app/**/page.tsx` server routing state ingestion
-   Client route-hook boundaries for interactive UI
-   Suspense fallback behavior around `useSearchParams`

Not covered:

-   Lens schema design details
-   Backend scope policy enforcement

## Components

-   **Server route pages (`app/**/page.tsx`)**
  - Parse/normalize lens and route state from `searchParams`/`params`.
  - Compose page sections and pass initial route state to client components when needed.

-   **Client route boundaries**
  - Encapsulate `usePathname` / `useSearchParams` / segment hooks.
  - Compute lightweight derived UI flags and local interaction state.

-   **Suspense fallbacks**
  - Provide stable loading skeletons for hook consumers during suspense.

## Boundaries

-   Server boundary owns page-level URL interpretation and initial state.
-   Client boundary owns hook-based route awareness and interaction updates.
-   Lens serialization/parsing remains in shared lens utilities (`lib/lens/*`).

## Invariants

-   Server pages are preferred for route composition and data derivation.
-   `useSearchParams` is never used without a `Suspense` wrapper at export boundary.
-   URL lens semantics remain unchanged by boundary refactors.

## Non-Goals

-   Replacing all client components with server components.
-   Introducing a global route-state store/provider for all routing needs.
-   Changing scope lens query contract semantics.

## Related Contracts

- `docs/contracts/attachments-model-contract.md`
- `docs/contracts/attachments-embedded-display-contract.md`
- `docs/contracts/scope-lens-contract.md`

Route naming note:

- Canonical implementation routes remain `/work/*`.
