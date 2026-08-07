# Phase 5 handoff — Minimal account settings UI

## What shipped

- `/settings` shows account profile (email, display name, workspace name for owners, last login)
- Profile edit via server actions (backend mode only)
- Sign out link → `GET /auth/logout`
- Owner-only delete account with typed confirmation (`Delete this account`)
- Soft-delete on `users` + `accounts`; OAuth callback blocks re-entry
- App layout redirects deleted sessions to `/auth/logout`
- Team/RBAC/scope mapping sections removed from settings UI

## Prerequisites

Same as Phase 3: `DATABASE_URL` set, optional `PLATFORM_SHELL_FE_DATA_SOURCE=backend`.

Mutations (save profile, delete account) require backend data source. Stub mode shows read-only profile with disabled controls.

## Manual verification

### Profile edit (owner)

1. Sign in, open `/settings`.
2. Change display name and workspace name, click **Save changes**.
3. Refresh — values should persist from `user_profiles.full_name` and `accounts.name`.

### Sign out

1. Click **Sign out** on settings (or header menu).
2. Session cleared; protected routes redirect to login.

### Delete account (owner)

1. Open danger zone → **Delete account**.
2. Type `Delete this account`, confirm.
3. Redirected to auth error page; signing in again via Google shows account deleted message.

### Non-owner (if multi-user row exists)

Delete controls hidden; profile save still works for display name only.

## SQL spot-checks

```sql
SELECT full_name FROM user_profiles WHERE user_id = '<your-user-id>';
SELECT name, deleted_at FROM accounts WHERE id = '<your-account-id>';
SELECT deleted_at FROM users WHERE account_id = '<your-account-id>';
```

## Next

[phase-6-verification.md](./phase-6-verification.md) — CI, E2E checklist, security review, branch merge gate.
