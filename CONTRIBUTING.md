# Contributing Guide

**Assistant-Scoped Platform Shell**

This repository keeps a lightweight but production-grade workflow so architectural contracts stay reviewable while the product surface evolves.

## Branching

- `main` is always deployable and protected.
- All work lands through short-lived branches and pull requests.

Example branch names:

- `feat/work-routes`
- `refactor/scope-lens`
- `docs/domain-agnostic-migration`

## Commits

Use Conventional Commits with a meaningful scope.

Examples:

- `feat(work): add scope detail routes`
- `refactor(scope): simplify global lens contract`
- `docs(migration): record evidence surface removal`

## Traceability

Each PR should reference the work item or migration slice it implements.

Expected chain:

`issue -> PR -> commit -> release`

## Pull requests

Every PR should cover:

- intent
- scope
- risk
- test plan
- follow-up work

Migration PRs should also note:

- renamed public contracts
- deleted legacy surfaces
- any temporary internal compatibility left behind

## Review checklist

- accidental diffs removed
- route and contract names consistent
- no product-specific branding added back into active surfaces
- user-facing copy matches the current generic vocabulary
- tests updated for changed routes and scope semantics

## Quality gates

Run before merge when the affected surfaces allow it:

- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`
