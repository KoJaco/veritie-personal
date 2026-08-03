# ADR-0009: Context Rail Resolver With Single Shell

## Status

Proposed

## Date

08-02-2026

## Context

We need a consistent, single-shell implementation of the Context Rail in the dashboard area. Current behavior risks hydration mismatches when route identity depends on payload timing, and duplicated rail rendering between pinned and overlay layouts. We also need a clear boundary between server-provided context payloads and client-resolved route configuration.

## Decision

Adopt a single `AppShellClient` in `/work/layout.tsx` and a client route resolver based on `useSelectedLayoutSegments()`. Server pages provide a minimal serializable context payload via `ContextPayloadSlot`. The client merges route configuration with the payload into a derived `RailContract`. Render `ContextRail` a single time and let it decide pinned vs overlay based on rail state.

## Alternatives Considered

- **Multiple shells or per-route shells** — increases duplication and risks inconsistent rail behavior across routes.
- **Route ID derived from payload** — creates transient mismatches during hydration and stale contract states.
- **Render rail in both pinned and overlay** — double-rendering risks inconsistent state and complexity in rail variants.

## Consequences

- **Pros**
    - Predictable rail contract derived solely from segments.
    - Clear boundary between server payload and client routing config.
    - Single rail render path simplifies state handling.
- **Cons**
    - Requires a client boundary at the dashboard layout.
    - Adds a small Zustand store for payload storage.
- **Follow-ups / TODOs**
    - Implement EvidenceTab to handle task vs evidence context safely.
    - Align activity tab labeling across dashboard vs detail routes.

## References

- Related docs/contracts: `docs/contracts/context-rail-contract.md`
