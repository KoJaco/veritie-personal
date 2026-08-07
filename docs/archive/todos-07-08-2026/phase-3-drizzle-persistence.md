# Phase 3 — Drizzle persistence layer (replace stubs)

## Scope

Database-backed repositories for core read models, replace stub persist in capture pipeline, switch data source to `backend` when configured, keep stub adapter for tests.

## Prerequisites

- Phase 2 complete: session auth, `requireUser`, middleware protection.

## Implementation checklist

- [x] `lib/db/repositories/*` for timeline, captures, tasks, resources, settings
- [x] Update `lib/data-source/backend-adapter.ts` — wire repositories
- [x] Update `lib/data-source/registry.ts` — auto `backend` when `DATABASE_URL` set (explicit `stub` overrides)
- [x] All repository queries scoped by `accountId` from `requireUser()` / `requireAccountScope()`
- [x] Replace stub persist in `lib/capture/persist-capture-from-job.ts`
- [x] Replace stub persist in `app/api/captures/route.ts` (session auth in backend mode)
- [x] Gate bearer secret for stub/scripted admin only when `kind === stub`
- [x] Set `PLATFORM_SHELL_FE_DATA_SOURCE=backend` in env docs
- [x] Keep stub adapter for tests (`jest` / explicit `stub` env)

## Data source switching

| Env | Behavior |
| --- | --- |
| `PLATFORM_SHELL_FE_DATA_SOURCE=stub` | In-memory stubs (tests, offline dev) — overrides `DATABASE_URL` |
| `PLATFORM_SHELL_FE_DATA_SOURCE=backend` | Drizzle repositories against Supabase |
| `DATABASE_URL` present (no explicit `stub`) | Auto-default to `backend` |

## Verification

- [x] Voice capture → rows in DB (`captures`, `voice_logs`, timeline events, `usage_events`)
- [x] Timeline/captures reflect persisted data when `backend` mode
- [x] Stub store used when `stub` mode (CI)
- [x] `npm test` passes with stub adapter in CI

## Phase review

- [ ] Performance review notes — queries use indexes on `accountId`; no N+1 on list routes
- [ ] Security review notes — every write includes `accountId` from session
- [ ] Maintainability review notes — repository boundary clear vs page-model builders

## Agent review record

- Date: 2026-08-05
- Findings: Tasks empty for new backend users; records UI still compliance stub
- Resolved: Documented in [phase-3-handoff.md](./phase-3-handoff.md)

## Handoff

See [phase-3-handoff.md](./phase-3-handoff.md) for env flip, SQL checks, and troubleshooting.
