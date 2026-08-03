# Domain-Agnostic Platform Migration Plan

## Summary

Convert the repository from a previous branded product framing into a reusable task-driven, assistant-scoped platform shell.

Preserve:

- `AppShell` and `TaskShell`
- route-scoped assistant runtime
- server-built `PageModel` boundaries
- global scope lens carried through navigation

Remove or replace:

- previous product branding from the earlier build
- legacy domain and compliance-oriented framing from the previous product build
- first-class `evidence` surface
- `frameworks` and `controls` taxonomy

## Target vocabulary

| Legacy | Target | Action |
| --- | --- | --- |
| dashboard | work | rename |
| assets | resources | rename |
| frameworks | scopes | rename and simplify |
| controls | checks | merge into scopes |
| evidence | attachments | remove as first-class surface, preserve capability where needed |
| framework lens | scope lens | rename and simplify |

## Migration matrix

| Surface | Decision | Notes |
| --- | --- | --- |
| Route shell and assistant context | preserve | keep architecture, rename public language |
| `/work` route family | rename | becomes `/work` |
| `/assets` | rename | becomes `/resources` |
| `/frameworks` and `/controls` | merge | become `/scopes` and nested `/checks` |
| `/evidence` | delete | retain generic attachment flows only where embedded |
| Docs and metadata | rename | archive legacy domain guidance |
| Stub data and fixtures | neutralize | move to operational examples |

## Banned legacy terms in active surfaces

These terms should not appear in active app routes, active docs, or active UI copy unless explicitly required for historical archive context:

- legacy product branding shorthand from the previous product build
- legacy domain branding shorthand from the previous product build
- `framework`
- `control`
- `evidence`

Archive-only exceptions:

- `docs/archive/**`
- historical ADRs and notes not yet superseded
- fixture content intentionally retained during migration with explicit follow-up

## Implementation slices

1. Planning and inventory
2. Public taxonomy and docs
3. Scope contract and route architecture
4. Surface migration
5. Internal cleanup and terminology hardening

## Current status: 2026-08-02

Fixture normalization (slice 11) and documentation cleanup (slice 12) are
complete. The migration is done at the application, fixture, and active
documentation layers.

See [`2026-08-02-domain-agnostic-current-status.md`](2026-08-02-domain-agnostic-current-status.md)
for the full slice history and verification baseline.

### Remaining optional follow-ups

| Area | Status | Notes |
| --- | --- | --- |
| Markdown artifact body copy | Optional | Neutralize headings/prose inside fixture `.md` files |
| Historical ADRs | Optional | Add superseded banners where body text mentions retired routes |
