# Architecture — Scope Lens Flow

## Purpose

Describe how scope lens state flows through Work route rendering, header controls, link generation, and context rail payloads.

## Scope

Covers:

- Lens helpers (`lib/lens/*`)
- Header lens indicator/dialog control on lens-relevant routes
- Page-level payload construction that includes lens metadata
- Link preservation via `withLens(...)`

Does not cover:

- Backend analytics logic
- Long-term preference persistence beyond URL state

## Components

- **Lens helpers** (`lib/lens/*`): parse, normalize, serialize, merge.
- **Lens UI controls** (`components/lens/*`): dialog control and inline switcher variants.
- **Work routes** (`app/(app)/work/*`): read lens from URL and build rail payloads.
- **Navigation links**: preserve lens using `withLens(...)`.
- **Context rail payload builder**: includes normalized lens for assistant/context summaries.

## Invariants

- URL is the canonical state boundary; active surfaces serialize only `?scope=<id>`.
- Lens UI components emit normalized scope lens objects only.
- Links between Work routes must carry scope lens keys unless explicitly omitted.

## References

- Related contracts: `docs/contracts/scope-lens-contract.md`, `docs/contracts/scope-matching-contract.md`
- Related ADRs: `docs/adr/0010-framework-lens-url-contract.md`
