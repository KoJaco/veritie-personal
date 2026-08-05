# Phase 5 — Minimal account settings UI

## Scope

Real user profile in existing `/settings`, sign out, soft-delete account. Hide team/RBAC/billing sections (deferred to multi-tenancy branch).

## Prerequisites

- Phase 2 complete: auth routes, session.
- Phase 3 recommended: settings read model from DB (or minimal session + DB profile query).

## Implementation checklist

- [x] Profile section in `app/(app)/settings/_components/SettingsPageContent.tsx`:
  - Google email (from session / `users`)
  - Display name (from `user_profiles`)
  - Last login (`users.lastLoginAt`)
- [x] Sign out link/button → `/auth/logout`
- [x] Server action: update display name / account name (owner)
- [x] Server action: delete account (owner only)
  - Soft-delete `users.deletedAt` + `accounts.deletedAt`
  - Sign out via Supabase
  - Port logic from `auth-example/_dash.dashboard.account.settings.tsx` delete flow
- [x] Hide or remove stub team/RBAC/billing sections in settings UI
- [x] Update settings page-model builder to use real data instead of stub adapter where applicable

## Files

- `app/(app)/settings/_components/SettingsPageContent.tsx`
- `app/(app)/settings/_page-model/build.ts` (if profile shape changes)
- Server actions (`app/(app)/settings/actions.ts`)

## Verification

- [x] Settings shows real user email and profile from DB
- [x] Sign out clears session and redirects appropriately
- [x] Delete account blocks re-login with deleted-account message (callback/login check)
- [x] Non-owner cannot delete account (if multi-user row exists in future)

## Phase review

- [x] Performance review notes — settings page single DB round-trip for profile
- [x] Security review notes — delete requires owner + session; soft-delete only
- [x] Maintainability review notes — team sections clearly deferred, not half-implemented

## Agent review record

- Date: 2026-08-05
- Findings: Audit logs on delete deferred; team/RBAC UI removed not hidden
- Resolved: Minimal account UI, layout deleted-session redirect, backend-only mutations

## Handoff

See [phase-5-handoff.md](./phase-5-handoff.md).
