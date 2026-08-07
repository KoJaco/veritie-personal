# Phase 1 — Init account, RLS, auth libraries

## Scope

RLS SQL kit (manual apply), Drizzle `initAccountWithUser`, permission seed, `requireUser` / `hasPermission`, onboarding `appConfig` on `accounts.settings`. **Library only** — no `/auth/*` routes (Phase 2).

## Prerequisites

- Phase 0 complete: schema, Drizzle client, env vars, migration applied to Supabase.

## Implementation checklist

- [x] `db/rls/` — helpers, enable RLS, identity + domain policies + README
- [x] `lib/domain/app-config.ts` — Zod schema, defaults from onboarding stub
- [x] `lib/domain/billing-config.ts` — billing tier + usage unit catalog
- [x] `lib/auth/init-account.ts` — `initAccountWithUser` (not `bootstrap-account`)
- [x] `lib/auth/permission-seed.ts` — full catalog; owner grants: account, captures, timeline_events
- [x] `lib/auth/require-user.ts` — session → `AppUser`
- [x] `lib/auth/deleted-account.ts` — soft-delete checks
- [x] `lib/permissions.server.ts` — `hasPermission` / `requirePermission`
- [x] `docs/architecture/db-access.md` — DATABASE_URL tenancy, RLS role, metering conventions
- [x] Unit tests for init-account, permission seed, app-config, require-user
- [ ] **Manual:** apply `db/rls/*.sql` in Supabase (see [phase-1-handoff.md](./phase-1-handoff.md))

## Files

- `db/rls/*.sql`, `db/rls/README.md`
- `lib/domain/app-config.ts`, `lib/domain/billing-config.ts`
- `lib/auth/init-account.ts`, `lib/auth/permission-seed.ts`, `lib/auth/require-user.ts`
- `lib/auth/deleted-account.ts`, `lib/auth/types.ts`, `lib/auth/errors.ts`
- `lib/permissions.server.ts`
- `lib/auth/__tests__/*`, `lib/domain/__tests__/app-config.test.ts`
- `docs/architecture/db-access.md`
- `docs/todos/phase-1-handoff.md`

## RLS strategy (hybrid)

- SQL in `db/rls/` — apply manually in Supabase
- App server uses `DATABASE_URL` pooler via Drizzle; **enforce `accountId` in code**
- RLS = defense-in-depth for publishable key + user JWT paths

## Verification

- [ ] Applied RLS SQL in Supabase
- [ ] `npm run typecheck` && `npm test`
- [ ] `initAccountWithUser` creates account/user/role/permissions/credit_balances
- [ ] `hasPermission(owner, 'captures', 'create')` true; `hasPermission(owner, 'users', 'retrieve')` false
- [ ] `accounts.settings.appConfig` matches onboarding profile or defaults
- [ ] RLS spot-check: cross-account read blocked via JWT client (handoff SQL)

## Handoff

See [phase-1-handoff.md](./phase-1-handoff.md) for apply steps, permission matrix, and verification queries.

## Phase review

- [ ] Performance review notes — init runs once per new user on callback (Phase 2)
- [ ] Security review notes — RLS policies reviewed; pooler not exposed to client
- [ ] Maintainability review notes — permission seed documented for future branches

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
