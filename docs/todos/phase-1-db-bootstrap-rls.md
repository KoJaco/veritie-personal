# Phase 1 — Database bootstrap + RLS

## Scope

Run migrations against Supabase, enable hybrid RLS policies, account bootstrap on first Google OAuth, `requireUser` / permissions server guards, soft-delete enforcement on login.

## Prerequisites

- Phase 0 complete: schema, Drizzle client, env vars, generated migrations.

## Implementation checklist

- [ ] Run migrations against Supabase (`DATABASE_URL` transaction pooler)
- [ ] RLS policies on tenant tables (identity + domain) — `account_id = (select account_id from users where id = auth.uid())`
- [ ] `lib/auth/bootstrap-account.ts` — port `createAccountWithUser` from `auth-example/_auth.callback.tsx`
- [ ] Account bootstrap on first OAuth: create `accounts`, `users` (id = auth uid), owner `roles`, seed `permissions` + `permission_roles` for personal-app entities
- [ ] `lib/auth/require-user.ts` — resolve `appUser` (user + `accountId` + role) from session + DB
- [ ] `lib/permissions.server.ts` — port `hasPermission` / `requirePermission` from auth-example
- [ ] Soft-delete check on login/callback (sign out + error if `users.deletedAt` or `accounts.deletedAt` set)
- [ ] Document: RLS is defense-in-depth; all Drizzle queries must still filter by `accountId`

## Files

- `db/migrations/*`
- `db/rls/*.sql` or migration-embedded policies
- `lib/auth/bootstrap-account.ts`
- `lib/auth/require-user.ts`
- `lib/permissions.server.ts`

## RLS strategy (hybrid)

- Enable RLS on all tenant-scoped tables
- App server uses `DATABASE_URL` pooler via Drizzle for bootstrap/migrations
- Route handlers use session from `requireUser()` and explicit `accountId` in queries
- Anon key + user JWT should be blocked from cross-account reads by RLS policies

## Verification

- [ ] Manual OAuth on staging: rows exist in `users` + `accounts`
- [ ] RLS blocks cross-account read via anon key + another user's JWT
- [ ] Re-login with soft-deleted account shows error and does not enter app

## Phase review

- [ ] Performance review notes — bootstrap runs once per new user on callback
- [ ] Security review notes — RLS policies reviewed; service role not exposed to client
- [ ] Maintainability review notes — permissions seed data documented for future multi-tenant branch

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
