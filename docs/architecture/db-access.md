# Database access and tenancy

## Phase 1 (current)

### Application queries

- Server routes and libraries use **Drizzle** via [`lib/db/index.ts`](../../lib/db/index.ts).
- Connection string: `DATABASE_URL` (Supabase transaction pooler).
- `prepare: false` is required for the pooler.

### Tenancy enforcement (primary)

Every query against tenant data must filter by `accountId` from [`requireUser()`](../../lib/auth/require-user.ts) / `AppUser.accountId`.

```ts
const appUser = await requireUser();
await db.query.captures.findMany({
  where: eq(captures.accountId, appUser.accountId),
});
```

Do not rely on RLS for app-server reads/writes in Phase 1.

### RLS (defense-in-depth)

- SQL policies live in [`db/rls/`](../../db/rls/) and are applied manually in Supabase.
- RLS protects direct access with the **publishable key + user JWT** (browser, PostgREST, future JWT-scoped paths).
- `service_role` / pooler connections bypass RLS — expected for `initAccountWithUser` and Drizzle.

Apply order: see [`db/rls/README.md`](../../db/rls/README.md).

## Account initialization

[`initAccountWithUser`](../../lib/auth/init-account.ts) runs in a single Drizzle transaction:

1. `accounts` — `plan: "free"`, `settings.appConfig` + `settings.billing`
2. `users` — `id` = Supabase `auth.users.id`, `role: owner`
3. `user_profiles`, `user_preferences`
4. Owner `roles` + `role_users`
5. Full `permissions` catalog per entity enum
6. `permission_roles` — owner granted **account**, **captures**, **timeline_events** only (Phase 1)
7. `credit_balances` — zeros (billing scaffold)

Phase 2 OAuth callback invokes this after onboarding.

## Onboarding → `accounts.settings`

| Field | Source |
| --- | --- |
| `settings.appConfig` | Onboarding wizard ([`lib/domain/app-config.ts`](../../lib/domain/app-config.ts)) |
| `settings.billing` | Free tier + usage unit catalog ([`lib/domain/billing-config.ts`](../../lib/domain/billing-config.ts)) |

Defaults match [`DEFAULT_ONBOARDING_PROFILE`](../../lib/onboarding-stub/state.ts) when no profile is passed.

## Usage metering (conventions)

| Unit | `usage_events.usage_type` | Quantity |
| --- | --- | --- |
| Voice capture | `voice_log` | `1` per persisted voice capture |
| Assistant (future) | `assistant_run` | `1` per run (not enforced yet) |

Billing tiers: `accounts.plan` = `free` | `paid`. Enforcement lands in a later phase.

## Permissions

- Catalog: all `entity` enum values seeded per account.
- Owner grants (Phase 1): `account`, `captures`, `timeline_events` — full CRUD.
- Hidden UI entities (`users`, `roles`, `billing`, …) are seeded but **not granted** until a later branch.

Use [`hasPermission`](../../lib/permissions.server.ts) / `requirePermission` — not raw role checks in routes.

## Future: session/JWT-scoped DB access

After the core path is stable:

1. Obtain user JWT from Supabase session.
2. Open a Postgres connection or Supabase client scoped to that JWT.
3. Let RLS enforce tenancy on those queries.
4. Keep `DATABASE_URL` for migrations, `initAccountWithUser`, and admin tasks only.

Not implemented in Phase 1.

## Related

- Phase 1 handoff: [`docs/todos/phase-1-handoff.md`](../todos/phase-1-handoff.md)
- Phase 2 auth routes: [`docs/todos/phase-2-auth-routes-middleware.md`](../todos/phase-2-auth-routes-middleware.md)
