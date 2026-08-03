# Architecture — Framework Lens Flow

## Purpose

Describe how lens state flows through dashboard route rendering, header controls, link generation, and context rail payloads.

## Scope

Covers:

- Lens helpers (`lib/lens.ts`)
- Header lens indicator/dialog control on lens-relevant routes
- Page-level payload construction that includes lens metadata
- Link preservation via `withLens(...)`

Does not cover:

- Backend framework analytics logic
- Long-term preference persistence beyond URL state

## Components

- **Lens helpers** (`lib/lens.ts`): parse, normalize, serialize, merge.
- **Lens UI controls** (`components/lens/*`): dialog control and inline switcher variants.
- **Page routes** (`app/work/*`): read lens from URL and build rail payloads.
- **Navigation links**: preserve lens using `withLens(...)`.
- **Context rail payload builder**: includes normalized lens for assistant/context summaries.

## Boundaries

- URL is the canonical state boundary.
- Lens UI components emit normalized lens objects only.
- Route pages own where lens controls are mounted and which variant is used.
- Rail consumes lens as metadata only; it does not own lens mutation.

## Invariants

- Every lens-relevant route can derive lens from URL without external state.
- Lens mutations update URL (replace navigation), then page state follows URL.
- Links between dashboard routes must carry lens keys unless explicitly omitted.
- UI controls reflect normalized lens state, never raw malformed params.

## Non-Goals

- Centralized global store for lens mode.
- App-wide “compliance mode” outside dashboard view context.
- Automatic persistence to remote profile settings.
