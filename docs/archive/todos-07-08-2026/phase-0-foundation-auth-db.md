# Phase 0 — Foundation (env, clients, schema layout)

## Scope

Supabase client utilities, Drizzle runtime client, identity schema from `auth-example/schema.ts`, `accountId` scoping on domain tables, env configuration, initial migration generation.

## Prerequisites

- Veritie integration branch merged or present (proxy, stub read models).
- Supabase project configured with Google OAuth provider.
- `DATABASE_URL` set (transaction pooler).

## Implementation checklist

- [x] Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.example`
- [x] `SUPABASE_SECRET_KEY` on server (`lib/config/env.server.ts`); legacy anon/service-role names as optional fallbacks
- [x] `lib/supabase/client.ts` — browser client (`createBrowserClient`)
- [x] `lib/supabase/server.ts` — server client with cookie read/write (`createServerClient`)
- [x] `lib/supabase/middleware.ts` — session refresh helper (`updateSession`)
- [x] `lib/db/index.ts` — Drizzle + postgres driver pool
- [x] `db/schema/identity.ts` — port identity/RBAC/billing tables from `auth-example/schema.ts`
- [x] Update `db/schema/capture.ts` — add `accountId` (uuid FK → `accounts.id`) on tenant tables
- [x] Update `db/schema/objects.ts` — add `accountId` on tenant tables
- [x] Update `db/schema/index.ts` — export identity schema
- [x] `drizzle-kit generate` — initial migration(s)
- [x] npm scripts: `db:generate`, `db:migrate`, `db:studio` (optional)
- [x] Update `lib/config/env.server.ts` and `lib/config/env.public.ts`

## Handoff

See [phase-0-handoff.md](./phase-0-handoff.md) for review checklist and auditor notes.

## Schema notes

**Port from `auth-example/schema.ts`:**

- Enums: `user_role`, `entity`, `actions`, `notification_type`, `subscription_status`
- Tables: `accounts`, `users`, `user_profiles`, `user_preferences`, `user_invitations`
- RBAC: `roles`, `role_users`, `permissions`, `permission_roles`
- Ops: `audit_logs`, `notifications`, `webhook_events`
- Billing (schema only): `plans`, `prices`, `subscriptions`, `subscription_items`, `stripe_webhook_events`, `credit_balances`, `credit_ledger`, `usage_counters`, `usage_events`, `usage_metrics`

**Do not port:** `clients`, `jobs`, `tags`, `media`, `galleries`, `job_elements`, legacy `captures`/`voice_logs`, `share_links`, `media_processing_jobs`, `platform_admins`, `contact_enquiries`.

**Critical:** `users.id` must equal Supabase `auth.users.id` on OAuth bootstrap (do not rely on `defaultRandom()` for auth-created users).

**ID types:** Keep text IDs on domain tables; scope with uuid `accountId`.

## Verification

- [x] `npm run typecheck`
- [x] `drizzle-kit generate` completes without errors
- [x] No service role key in client bundle

## Phase review

- [x] Performance review notes — N/A (no runtime query paths yet)
- [x] Security review notes — env vars documented; secrets server-only
- [x] Maintainability review notes — schema split: `identity.ts` vs `capture.ts` vs `objects.ts`

## Agent review record

- Date: 2026-08-04
- Findings: indent fix on env.public; shared `accountIdColumn`; Drizzle reads `envServer.databaseUrl`; middleware soft-noop documented for Phase 2
- Resolved: audit fixes applied before commit; migration generated but not applied
