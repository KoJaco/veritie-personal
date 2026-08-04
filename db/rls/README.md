# Row Level Security (RLS) — manual apply kit

Phase 1 delivers SQL policies for defense-in-depth. The Next.js app uses `DATABASE_URL` (pooler) and enforces `accountId` in Drizzle queries. RLS protects direct access via Supabase publishable key + user JWT.

## Apply order

Run in the Supabase SQL editor (or `psql` against your project) in this order:

1. [`00_helpers.sql`](./00_helpers.sql) — `current_account_id()` helper
2. [`01_enable_rls.sql`](./01_enable_rls.sql) — enable RLS on tenant tables
3. [`02_policies_identity.sql`](./02_policies_identity.sql) — identity / RBAC / billing
4. [`03_policies_domain.sql`](./03_policies_domain.sql) — captures, timeline, objects

## Tables without RLS

These are global or service-only (app uses `DATABASE_URL`, not user JWT):

- `plans`, `prices` — Stripe catalog
- `stripe_webhook_events`, `webhook_events` — webhook idempotency (server-only writes)

## Rollback

To disable RLS on a table (emergency only):

```sql
ALTER TABLE public.captures DISABLE ROW LEVEL SECURITY;
-- DROP POLICY ... on each table if removing policies only
```

## Verification

After apply, as an authenticated user JWT (not service role):

```sql
-- Should return only your account's rows
SELECT id FROM captures LIMIT 5;

-- Should return only your user row
SELECT id, email FROM users WHERE id = auth.uid();
```

Cross-account reads should return zero rows when using another user's JWT.

## Related

- App access pattern: [`docs/architecture/db-access.md`](../../docs/architecture/db-access.md)
- Phase 1 handoff: [`docs/todos/phase-1-handoff.md`](../../docs/todos/phase-1-handoff.md)
