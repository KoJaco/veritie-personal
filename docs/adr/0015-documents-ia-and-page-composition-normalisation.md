# ADR 0015 — Documents IA And Page Composition Normalisation

## Status

Accepted

## Context

The dashboard route layer had drifted in two directions:

1. The library route labeled `Objects` no longer matched how the product is described to audit and compliance users.
2. Primary routes were inconsistent in how they composed pages, built page models, and injected assistant/context payloads.

Branch 21 is the normalization pass that sits after the primary product surfaces were delivered and before onboarding/hardening follow-up work.

## Decision

### 1. Rename `Objects` to `Documents`

- Canonical route is `/work/documents` with `/work/documents/[id]`.
- Navigation, breadcrumbs, route copy, assistant route ids, and route-facing docs use `Documents`.
- The rationale:
  - `Documents` is clearer for both technical and non-technical users.
  - It aligns better with audit/compliance language than the generic `Objects` label.
  - It leaves room for future document classes without re-explaining the IA.

### 2. Normalize page composition around route-local seams

- Page files should stay focused on:
  - parsing route state
  - loading data
  - composing validated page-model contracts
  - rendering a route header plus route-local content
- Route-local rendering belongs in `_components`.
- Route-local contract code belongs in `_page-model`.
- Shared components are only promoted when already meaningfully reused.

### 3. Keep Branch 21 light on styling abstraction

- Branch 21 standardizes page rhythm, header spacing, and surface usage using the existing primitives.
- It does not introduce the full visual convention layer planned for the later hardening/normalisation branch.
- The purpose here is consistency first, not a broad style-system rewrite.

### 4. Stabilize the shell header slot

- The app-shell page-header slot uses a stable minimum-height placeholder so reloads and route transitions do not visibly jump while header content hydrates.
- This is a small shell refactor, not a shell architecture rewrite.

## Consequences

- The repo now has one canonical route vocabulary for the document library surface.
- Primary routes have a more consistent page-model and payload construction pattern.
- Some lower-level data-source names still reflect the older object-oriented stub model, but route-facing architecture and contracts now normalize on `Documents`.
- Deeper surface-composition abstraction and broader visual tightening remain deferred to the later hardening pass.

## Branch 21 Verification

- Verified route families now follow the same composition rule:
  - dashboard
  - tasks index/detail
  - documents index/detail
  - evidence index/detail
  - assets index/detail
  - connections index/detail
  - controls index
  - settings
  - frameworks index and framework control routes
- The rule is:
  - page files fetch, parse route state, build/enforce page-model contracts, and compose route-local content
  - route-local rendering lives in `_components`
  - route-local helper logic lives in `_lib` where it is non-trivial
  - `_page-model` owns build/schema/validate concerns
