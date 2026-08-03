# Contract: Route State Boundary (Server + Client)

## Purpose

Define how URL route/query state is sourced and consumed between server route pages and client UI components.

## Scope

Includes:

- Server page consumption of `searchParams`/`params`
- Client route hook usage (`usePathname`, `useSearchParams`, `useSelectedLayoutSegment`)
- Suspense wrapping requirements for `useSearchParams` consumers

Out of scope:

- Lens query schema semantics (covered by lens contract)
- Backend API validation/authz

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible
- **Change policy:** Additive changes only within v1; breaking source-of-truth changes require v2

## Definitions

- **Server route state**: URL state available in `app/**/page.tsx` via `searchParams`/`params`.
- **Client route boundary**: A small client component that consumes route hooks for interactive route-aware UI behavior.

## Contract Shape (Conceptual)

### Required fields

- `source_of_truth` — page-level URL state comes from server `searchParams`/`params`.
- `client_boundary` — route hook consumption is isolated to client components.
- `suspense_wrapper` — any `useSearchParams()` consumer is exported via `Suspense` fallback.

### Optional fields

- `initial_route_state` — server-derived initial values passed to client boundary for hydration stability.

## Invariants (Must Always Hold)

- Page files are not marked `"use client"` only to read route/query state.
- `useSearchParams()` consumers are wrapped in `Suspense` as per Next.js documentation.
- Lens URL behavior remains functionally equivalent before/after boundary extraction.
- Client boundaries stay narrow and do not own full page data loading.

## Error Handling

- Invalid/missing query values are normalized at lens parsing boundaries.
- During `Suspense`, fallback skeleton UI is rendered; no route crash.
- Hook-dependent client boundaries must fail closed visually (placeholder/skeleton), not with runtime errors.

## Examples

Provide one minimal valid example and one invalid example with expected handling.

### Minimal valid example

```tsx
// Server page
export default async function Page({
    searchParams,
}: {
    searchParams: Promise<SearchParamRecord>;
}) {
    const lens = getLensFromSearchParams(await searchParams);
    return <MyClientBoundary initialLens={lens} />;
}

// Client boundary
export function MyClientBoundary({
    initialLens,
}: {
    initialLens: ScopeLens;
}) {
    return <UI initialLens={initialLens} />;
}
```

### Invalid example

```tsx
// Avoid: clientifying page solely for URL reads
"use client";
export default function Page() {
    const searchParams = useSearchParams();
    return <UI />;
}
```

### Operational notes

- Prefer server `searchParams` for deterministic page-level behavior.
- Keep suspense fallbacks lightweight to avoid layout shift.

### References

- Related ADRs: `docs/adr/0012-server-page-client-route-boundary-and-suspense.md`
- Related contracts: `docs/contracts/page-model-contract.md`
- Issue/PR: TBD
