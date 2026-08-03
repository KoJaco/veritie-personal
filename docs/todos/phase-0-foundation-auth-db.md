# Phase 0 — Foundation (env, clients, schema layout)

## Scope

Supabase client utilities, Drizzle runtime client, identity schema from `auth-example/schema.ts`, `accountId` scoping on domain tables, env configuration, initial migration generation.

## Prerequisites

- Veritie integration branch merged or present (proxy, stub read models).
- Supabase project configured with Google OAuth provider.
- `DATABASE_URL` set (transaction pooler).

## Implementation checklist

- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.example`
- [ ] Align `AUTH_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` (or map in env layer)
- [ ] `lib/supabase/client.ts` — browser client (`createBrowserClient`)
- [ ] `lib/supabase/server.ts` — server client with cookie read/write (`createServerClient`)
- [ ] `lib/supabase/middleware.ts` — session refresh helper (`updateSession`)
- [ ] `lib/db/index.ts` — Drizzle + postgres driver pool
- [ ] `db/schema/identity.ts` — port identity/RBAC/billing tables from `auth-example/schema.ts`
- [ ] Update `db/schema/capture.ts` — add `accountId` (uuid FK → `accounts.id`) on tenant tables
- [ ] Update `db/schema/objects.ts` — add `accountId` on tenant tables
- [ ] Update `db/schema/index.ts` — export identity schema
- [ ] `drizzle-kit generate` — initial migration(s)
- [ ] npm scripts: `db:generate`, `db:migrate`, `db:studio` (optional)
- [ ] Update `lib/config/env.server.ts` and `lib/config/env.public.ts`

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

- [ ] `npm run typecheck`
- [ ] `drizzle-kit generate` completes without errors
- [ ] No service role key in client bundle

## Phase review

- [ ] Performance review notes — N/A (no runtime query paths yet)
- [ ] Security review notes — env vars documented; secrets server-only
- [ ] Maintainability review notes — schema split: `identity.ts` vs `capture.ts` vs `objects.ts`

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
