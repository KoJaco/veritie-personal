# Phase 0 — Foundation

## Scope

Domain types, Drizzle schema (no runtime), aspect taxonomy, planning docs.

## Prerequisites

- Domain-agnostic migration complete.

## Implementation checklist

- [x] `lib/domain/` — capture, extraction, timeline, task, reminder, goal, money, record, resource, aspect
- [x] `lib/aspect/` — aspect definitions (finance, fitness, work, personal, admin)
- [x] `db/schema/` — Drizzle tables for core + projected objects
- [x] `drizzle.config.ts` — PostgreSQL / Supabase target
- [x] `docs/planning/2026-08-03-voice-log-personal-restructure-plan.md`
- [x] Update `docs/planning/README.md`
- [x] PageModel `meta.aspect` planned for Phase 1 (not implemented here)

## Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## Phase review

- [ ] Performance review notes — N/A (no runtime paths)
- [ ] Security review notes — no secrets in schema; RLS deferred to Supabase phase
- [ ] Maintainability review notes — domain types align with Drizzle tables

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
