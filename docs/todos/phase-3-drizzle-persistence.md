# Phase 3 — Drizzle persistence layer (replace stubs)

## Scope

Database-backed repositories for all read models, replace stub persist in capture pipeline, switch data source to `backend` when configured, keep stub adapter for tests.

## Prerequisites

- Phase 2 complete: session auth, `requireUser`, middleware protection.

## Implementation checklist

- [ ] `lib/data-source/drizzle-*-repository.ts` (or per-domain repos) for:
  - timeline
  - captures
  - tasks
  - records
  - resources
  - goals
  - money
  - settings read model
- [ ] Update `lib/data-source/backend-adapter.ts` — wire repositories
- [ ] Update `lib/data-source/registry.ts` — default `backend` when `DATABASE_URL` set (or explicit env flip)
- [ ] All repository queries scoped by `accountId` from `requireUser()`
- [ ] Replace stub persist in `lib/capture/persist-capture-client.ts`
- [ ] Replace stub persist in `app/api/captures/route.ts`
- [ ] Gate or remove `lib/api/require-internal-stub-api-access.ts` — session auth instead of bearer secret
- [ ] Set `PLATFORM_SHELL_FE_DATA_SOURCE=backend` in env docs
- [ ] Keep stub adapter for tests (`jest` mocks / `DATA_SOURCE=stub`)

## Data source switching

| Env | Behavior |
| --- | --- |
| `PLATFORM_SHELL_FE_DATA_SOURCE=stub` | In-memory stubs (tests, offline dev) |
| `PLATFORM_SHELL_FE_DATA_SOURCE=backend` | Drizzle repositories against Supabase |
| `DATABASE_URL` present | Consider auto-defaulting to `backend` |

## Verification

- [ ] Voice capture → rows in DB (`captures`, `voice_logs`, timeline events, etc.)
- [ ] Timeline/tasks/records reflect persisted data in UI
- [ ] Stub store not used in dev with `backend` mode
- [ ] `npm test` passes with stub adapter in CI

## Phase review

- [ ] Performance review notes — queries use indexes on `accountId`; no N+1 on list routes
- [ ] Security review notes — every write includes `accountId` from session
- [ ] Maintainability review notes — repository boundary clear vs page-model builders

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
