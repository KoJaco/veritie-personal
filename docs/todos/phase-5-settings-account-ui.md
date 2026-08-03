# Phase 5 — Minimal account settings UI

## Scope

Real user profile in existing `/settings`, sign out, soft-delete account. Hide team/RBAC/billing sections (deferred to multi-tenancy branch).

## Prerequisites

- Phase 2 complete: auth routes, session.
- Phase 3 recommended: settings read model from DB (or minimal session + DB profile query).

## Implementation checklist

- [ ] Profile section in `app/(app)/settings/_components/SettingsPageContent.tsx`:
  - Google email (from session / `users`)
  - Display name (from `user_profiles`)
  - Last login (`users.lastLoginAt`)
- [ ] Sign out link/button → `/auth/logout`
- [ ] Server action: update display name / account name (owner)
- [ ] Server action: delete account (owner only)
  - Soft-delete `users.deletedAt` + `accounts.deletedAt`
  - Sign out via Supabase
  - Port logic from `auth-example/_dash.dashboard.account.settings.tsx` delete flow
- [ ] Hide or remove stub team/RBAC/billing sections in settings UI
- [ ] Update settings page-model builder to use real data instead of stub adapter where applicable

## Files

- `app/(app)/settings/_components/SettingsPageContent.tsx`
- `app/(app)/settings/_page-model/build.ts` (if profile shape changes)
- Server actions (e.g. `app/(app)/settings/actions.ts`)

## Verification

- [ ] Settings shows real user email and profile from DB
- [ ] Sign out clears session and redirects appropriately
- [ ] Delete account blocks re-login with deleted-account message (callback/login check)
- [ ] Non-owner cannot delete account (if multi-user row exists in future)

## Phase review

- [ ] Performance review notes — settings page single DB round-trip for profile
- [ ] Security review notes — delete requires owner + session; soft-delete only
- [ ] Maintainability review notes — team sections clearly deferred, not half-implemented

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
