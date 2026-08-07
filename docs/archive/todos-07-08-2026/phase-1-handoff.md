# Phase 1 handoff — Init account, RLS, auth libraries

**Status:** Ready for review  
**Previous:** [phase-0-handoff.md](./phase-0-handoff.md)  
**Next phase:** [phase-2-auth-routes-middleware.md](./phase-2-auth-routes-middleware.md)

## Summary

Phase 1 delivers library-only auth and tenancy primitives: manual RLS SQL kit, `initAccountWithUser`, permission seeding, `requireUser`, and typed onboarding/billing config on `accounts.settings`. No `/auth/*` routes or middleware yet — Phase 2 wires OAuth callback to `initAccountWithUser`.

## What was delivered

### RLS apply kit (`db/rls/`)

| File | Purpose |
| --- | --- |
| [`db/rls/README.md`](../../db/rls/README.md) | Apply order, Supabase SQL editor / `psql` steps, rollback notes |
| [`db/rls/00_helpers.sql`](../../db/rls/00_helpers.sql) | `current_account_id()` helper |
| [`db/rls/01_enable_rls.sql`](../../db/rls/01_enable_rls.sql) | `ENABLE ROW LEVEL SECURITY` on tenant tables |
| [`db/rls/02_policies_identity.sql`](../../db/rls/02_policies_identity.sql) | Identity, RBAC, billing policies |
| [`db/rls/03_policies_domain.sql`](../../db/rls/03_policies_domain.sql) | Domain table policies |

**You must apply these manually** in Supabase (Phase 1 code does not run them).

### Domain config

| File | Role |
| --- | --- |
| [`lib/domain/app-config.ts`](../../lib/domain/app-config.ts) | Zod `AppConfig`, onboarding profile mapping, defaults |
| [`lib/domain/billing-config.ts`](../../lib/domain/billing-config.ts) | `BillingConfig`, usage unit catalog, `buildAccountSettings` |

### Auth libraries

| File | Role |
| --- | --- |
| [`lib/auth/init-account.ts`](../../lib/auth/init-account.ts) | `initAccountWithUser`, `deriveAccountNameFromEmail`, `findAppUserByAuthId` |
| [`lib/auth/permission-seed.ts`](../../lib/auth/permission-seed.ts) | Full permission catalog; owner grants for account/captures/timeline_events |
| [`lib/auth/require-user.ts`](../../lib/auth/require-user.ts) | `requireUser`, `getOptionalUser` |
| [`lib/auth/deleted-account.ts`](../../lib/auth/deleted-account.ts) | Soft-delete checks |
| [`lib/auth/types.ts`](../../lib/auth/types.ts) | `AppUser`, entity/action types |
| [`lib/auth/errors.ts`](../../lib/auth/errors.ts) | Typed auth errors |
| [`lib/permissions.server.ts`](../../lib/permissions.server.ts) | `hasPermission`, `requirePermission` |

### Documentation

| File | Role |
| --- | --- |
| [`docs/architecture/db-access.md`](../../docs/architecture/db-access.md) | DATABASE_URL tenancy, RLS role, usage metering conventions |

## Apply RLS (manual)

1. Open Supabase → SQL Editor (or `psql` with service connection).
2. Run in order:
   - `db/rls/00_helpers.sql`
   - `db/rls/01_enable_rls.sql`
   - `db/rls/02_policies_identity.sql`
   - `db/rls/03_policies_domain.sql`
3. Confirm policies exist:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Rollback: drop policies per table or disable RLS — see [`db/rls/README.md`](../../db/rls/README.md).

## Permission matrix (Phase 1 owner role)

| Entity | Owner granted | Notes |
| --- | --- | --- |
| `account` | Yes — full CRUD | Active |
| `captures` | Yes — full CRUD | Active |
| `timeline_events` | Yes — full CRUD | Active |
| `users`, `roles`, `permissions` | No | Catalog seeded; UI deferred |
| `billing`, `subscriptions`, `usage_metrics` | No | Billing scaffold only |
| `audit_logs`, `jobs` | No | Future admin surfaces |
| Personal entities (`tasks`, `records`, …) | No | Phase 3 repositories |

Verify in app code (after init):

```ts
await hasPermission(ownerUserId, "captures", "create"); // true
await hasPermission(ownerUserId, "users", "retrieve");    // false
```

## Init account transaction

`initAccountWithUser` writes (single Drizzle transaction via `DATABASE_URL`):

1. `accounts` — `plan: "free"`, `settings: { appConfig, billing }`
2. `users` — `id` = Supabase auth uid, `role: owner`
3. `user_profiles`, `user_preferences`
4. Owner `roles` + `role_users`
5. Full `permissions` catalog per entity enum
6. `permission_roles` — owner linked only to granted entities
7. `credit_balances` — zeros
8. `audit_logs` — `account.created`

Phase 2 callback calls this with optional onboarding profile from sessionStorage.

## Verification checklist

- [ ] Applied `db/rls/*.sql` in Supabase
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (includes `lib/auth/__tests__`, `lib/domain/__tests__/app-config.test.ts`)
- [ ] Manual or integration: `initAccountWithUser` creates expected rows
- [ ] `accounts.settings.appConfig` matches onboarding profile or defaults
- [ ] RLS spot-check: cross-account `SELECT` blocked with publishable key + user JWT (see below)

### RLS spot-check (two test users)

After creating two accounts via init (or Phase 2 OAuth):

1. Sign in as user A in browser; copy JWT from Supabase session.
2. Using Supabase client with publishable key + user A JWT, `SELECT` from `captures` — only A's rows.
3. Attempt to read user B's `account_id` rows — should return empty or error per policy.

App-server Drizzle via pooler bypasses RLS — that is expected for bootstrap; app code must filter by `accountId`.

## Explicitly not in Phase 1

- `/auth/*` routes, `middleware.ts`
- Stripe webhooks, paid checkout, usage enforcement at capture time
- Drizzle repositories replacing stubs (Phase 3)
- JWT-scoped Drizzle connection

## Phase review

- [ ] Performance — init runs once per new user on callback (Phase 2)
- [ ] Security — RLS reviewed; service role / pooler not exposed to client
- [ ] Maintainability — permission seed documented for future multi-tenant branch

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
