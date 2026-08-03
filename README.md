# Assistant-Scoped Platform Shell

Task-driven Next.js application shell with route-scoped assistant context, server-built page models, and a global scope lens.

## Current direction

This repository is being actively migrated away from a previous branded product framing into a domain-agnostic platform shell.

Core platform invariants that remain in scope:

- task-driven UI composition
- assistant runtime scoped per route
- server-first page composition
- explicit `PageModel` and rail payload contracts
- global scope selection preserved through navigation

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables

Public variables are defined with `NEXT_PUBLIC_*` and are safe to expose to the browser. Server-only secrets must not be imported into client code.

Typed access lives in:

- `lib/config/env.public.ts`
- `lib/config/env.server.ts`

## Documentation

- Active migration plan: `docs/planning/2026-06-08-domain-agnostic-migration-plan.md`
- Slice logs: `docs/planning/`
- Stable documentation guide: `docs/README.md`

## Status

Slice 15 completed entity tagging neutralization across Work: tasks, documents, resources, attachments, dashboard workstreams, and activity now use `scopeIds` with scope labels instead of legacy `frameworkTags`. Slice 14 scope pages and checks were already scope-first. Legacy URL query param mapping remains for backward compatibility only.
