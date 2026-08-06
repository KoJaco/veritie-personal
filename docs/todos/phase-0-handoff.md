# Phase 0 handoff — Foundation (auth + DB)

**Status:** Ready for review  
**Next phase:** [phase-1-db-bootstrap-rls.md](./phase-1-db-bootstrap-rls.md)

## Summary

Phase 0 lays the database schema and server infrastructure for Supabase Google auth and Drizzle persistence. No auth routes, middleware, or runtime queries yet — those are Phase 1–2.

## What was delivered

### Environment

- [`.env.example`](../../.env.example) — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, data-source note
- [`lib/config/env.public.ts`](../../lib/config/env.public.ts) — `supabaseUrl`, `supabasePublishableKey`
- [`lib/config/env.server.ts`](../../lib/config/env.server.ts) — `databaseUrl`, `supabaseSecretKey`, `supabasePublishableKey` (server alias)

### Supabase clients (not wired to routes yet)

| File | Role |
| --- | --- |
| [`lib/supabase/client.ts`](../../lib/supabase/client.ts) | Browser `createBrowserClient` |
| [`lib/supabase/server.ts`](../../lib/supabase/server.ts) | Server `createServerClient` + cookies |
| [`lib/supabase/middleware.ts`](../../lib/supabase/middleware.ts) | `updateSession()` for future middleware |

### Drizzle

| File | Role |
| --- | --- |
| [`lib/db/index.ts`](../../lib/db/index.ts) | Lazy `getDb()` + `db` proxy (`prepare: false` for pooler) |
| [`drizzle.config.ts`](../../drizzle.config.ts) | Unchanged — points at `db/schema` |
| [`db/migrations/0000_overrated_talon.sql`](../../db/migrations/0000_overrated_talon.sql) | Initial migration (37 tables) |

### Schema layout

| File | Contents |
| --- | --- |
| [`db/schema/identity.ts`](../../db/schema/identity.ts) | Accounts, users, RBAC, billing tables, audit, notifications — from `auth-example/schema.ts` (no job/media legacy) |
| [`db/schema/capture.ts`](../../db/schema/capture.ts) | Voice pipeline + timeline — **added `accountId`** on all tables |
| [`db/schema/objects.ts`](../../db/schema/objects.ts) | Tasks, goals, records, etc. — **added `accountId`** |
| [`db/schema/index.ts`](../../db/schema/index.ts) | Exports identity → capture → objects |

**Design choices:**

- `users.id` has **no** `defaultRandom()` — must be set to Supabase `auth.users.id` on bootstrap (Phase 1)
- Domain row IDs remain `text`; tenancy via uuid `accountId`
- `entity` enum extended with `tasks`, `records`, `resources`, `goals`, `reminders`, `money_entries`, `timeline_events` for future permission seeding

### Tooling

- `npm run db:generate` — `drizzle-kit generate`
- `npm run db:migrate` — `drizzle-kit migrate`
- `npm run db:studio` — `drizzle-kit studio`
- Dependency: `postgres` (postgres.js driver)

### Other

- [`tsconfig.json`](../../tsconfig.json) — excluded `auth-example/` from `tsc` (reference Remix routes, not app code)

## What was NOT done (by design)

- No `middleware.ts` at project root
- No `/auth/*` routes
- No RLS policies in SQL
- No `createAccountWithUser` / `requireUser`
- No migration applied to your Supabase project (generate only)
- Stub data layer still default (`PLATFORM_SHELL_FE_DATA_SOURCE=stub`)

## Review checklist (for auditor)

### Env / secrets

- [ ] Confirm `.env` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_PUBLISHABLE_KEY` for server/middleware), `DATABASE_URL`
- [ ] Confirm `SUPABASE_SECRET_KEY` is set server-only (not `NEXT_PUBLIC_*`)
- [ ] Google OAuth redirect URL in Supabase dashboard will include `https://<host>/auth/callback` (Phase 2)

### Schema

- [ ] Skim `db/schema/identity.ts` — no legacy `jobs`/`media` tables from auth-example
- [ ] Confirm every domain table has `accountId` FK → `accounts.id`
- [ ] Confirm `users.id` is plain PK (no default) for auth uid alignment

### Migration

- [ ] Review `db/migrations/0000_overrated_talon.sql` before applying to production
- [ ] Run locally/staging: `npm run db:migrate` with `DATABASE_URL` pointed at Supabase pooler
- [ ] Optional: `npm run db:studio` to inspect empty schema

### Security

- [ ] `lib/supabase/client.ts` only uses publishable key (no secret key in client bundle)
- [ ] `lib/db/index.ts` is `server-only` and uses `DATABASE_URL` (not exposed to browser)

### CI

- [ ] `npm run typecheck` passes
- [ ] `drizzle-kit generate` succeeds (already run once; re-run if schema changes)

## Known risks / follow-ups for Phase 1

1. **RLS not enabled** — tables are wide open until Phase 1 policies land
2. **Migration name** — `0000_overrated_talon.sql` is drizzle-kit auto-name; fine to keep or rename before first apply
3. **Secret-key admin client** — Phase 1 may need `lib/supabase/admin.ts` (secret key) for bootstrap if RLS blocks inserts during OAuth callback
4. **Enum drift** — `entity` enum includes legacy values (`jobs`, `clients`) for RBAC compatibility; personal-app seed in Phase 1 should use new entities
5. **Middleware soft-noop** — `updateSession` returns next() when Supabase env is missing; Phase 2 route protection must fail closed

## Phase 0 audit (2026-08-04)

### Security — pass with notes

| Check | Result |
| --- | --- |
| `.env` gitignored; no secrets in committed tree | Pass |
| Browser client uses publishable key only | Pass |
| Secret key only via `env.server` / server `.env` section | Pass |
| `lib/db` and `lib/supabase/server` marked `server-only` | Pass |
| `users.id` has no `defaultRandom()` (must match auth uid) | Pass |
| RLS / route guards | Deferred to Phase 1–2 |

### Maintainability — pass (fixes applied in audit)

| Check | Result |
| --- | --- |
| Schema split: identity / tenancy / capture / objects | Pass |
| Shared `accountIdColumn` (`db/schema/tenancy.ts`) | Fixed |
| Publishable + secret env naming (legacy fallbacks kept) | Pass |
| Drizzle uses `envServer.databaseUrl` | Fixed |
| `auth-example/` excluded from `tsc` | Pass |

## Suggested local verification commands

```bash
# After filling .env
npm run typecheck
npm run db:migrate
npm run db:studio
```

## Files touched (quick index)

```
.env.example
package.json (+ postgres, db:* scripts)
tsconfig.json (exclude auth-example)
db/schema/identity.ts (new)
db/schema/tenancy.ts (new)
db/schema/capture.ts
db/schema/objects.ts
db/schema/index.ts
db/migrations/0000_overrated_talon.sql (generated)
lib/config/env.public.ts
lib/config/env.server.ts
lib/db/index.ts (new)
lib/supabase/client.ts (new)
lib/supabase/server.ts (new)
lib/supabase/middleware.ts (new)
docs/todos/phase-0-handoff.md
docs/todos/phase-0-foundation-auth-db.md
docs/todos/phase-6-verification.md
docs/todos/README.md
```
