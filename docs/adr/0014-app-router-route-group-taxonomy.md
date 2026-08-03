# ADR-0014: App Router Route Group Taxonomy

## Status

Accepted

## Date

2026-03-02

## Context

Route boundaries in `app/` were partially implied by naming conventions instead of explicit App Router route groups. This made ownership and policy boundaries less obvious, especially for auth vs product vs legal/public surfaces.

We need a standard taxonomy that preserves URLs while enforcing architecture boundaries for layout, auth checks, and route-local colocation.

## Decision

Adopt these route groups now:

- `(site)` for public marketing and informational pages.
- `(app)` for authenticated product routes (`/work/**` and related product surfaces).
- `(auth)` for authentication-only flows.
- `(legal)` for legal/policy pages.
- `(onboarding)` for post-auth linear onboarding flows.
- `(support)` reserved and scaffolded for future support/helpdesk routes.

Future route groups are documented but not introduced until trigger conditions are met:

- `(docs)` only when docs require dedicated layout/nav/search or separate content pipeline.
- `(settings)` only when settings becomes a mini-app with distinct IA/layout boundaries.

Migration in this change:

- moved the root marketing page from `app/page.tsx` to `app/(site)/page.tsx`.
- retained dashboard routes under `app/(app)/work/**`.
- introduced minimal scaffolds for `(auth)`, `(legal)`, `(onboarding)`, `(support)`.

## Alternatives Considered

- **Flat route tree without groups** — rejected because policy and ownership boundaries remain implicit.
- **Add all possible groups immediately (including docs/settings)** — rejected to avoid premature fragmentation.

## Consequences

- **Pros**
- Clear mental model for route ownership and policy boundaries.
- Safer separation of auth and product layouts/middleware concerns.
- Keeps URLs stable while improving internal architecture.

- **Cons**
- Initial migration churn for moved files and references.
- Requires docs upkeep as future groups are activated.

- **Follow-ups / TODOs** (optional)
- Add lint or CI checks to prevent route-scope leakage across groups.
- Introduce `(docs)` and `(settings)` only when documented triggers are met.

## References

- Issue: TBD
- PR: TBD
- Related docs/contracts: `docs/contracts/work-route-contract.md`, `docs/contracts/scopes-route-contract.md`
