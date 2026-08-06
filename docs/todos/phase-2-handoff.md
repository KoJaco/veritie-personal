# Phase 2 handoff — Auth routes + middleware

**Status:** Ready for review  
**Previous:** [phase-1-handoff.md](./phase-1-handoff.md)  
**Next phase:** [phase-3-drizzle-persistence.md](./phase-3-drizzle-persistence.md)

## Summary

Phase 2 wires Google OAuth at `/auth/*`, root session middleware protecting `app/(app)` and `/api`, and landing/onboarding flow so new users complete onboarding then sign up via callback → `initAccountWithUser`.

## What was delivered

### Middleware

| File | Role |
| --- | --- |
| [`middleware.ts`](../../middleware.ts) | Session refresh + redirect unauthenticated users to `/auth/login?next=…` |
| [`lib/supabase/middleware.ts`](../../lib/supabase/middleware.ts) | `updateSession` returns `{ response, user }` |

**Public paths:** `/`, `/onboarding`, `/auth/*`  
**Protected:** all other matched routes including `/api/*`

### Auth routes

| Route | File |
| --- | --- |
| `/auth/login` | [`app/(auth)/auth/login/page.tsx`](../../app/(auth)/auth/login/page.tsx) |
| `/auth/signup` | [`app/(auth)/auth/signup/page.tsx`](../../app/(auth)/auth/signup/page.tsx) |
| `/auth/social` | [`app/(auth)/auth/social/route.ts`](../../app/(auth)/auth/social/route.ts) |
| `/auth/callback` | [`app/(auth)/auth/callback/route.ts`](../../app/(auth)/auth/callback/route.ts) |
| `/auth/logout` | [`app/(auth)/auth/logout/route.ts`](../../app/(auth)/auth/logout/route.ts) |
| `/auth/error` | [`app/(auth)/auth/error/page.tsx`](../../app/(auth)/auth/error/page.tsx) |
| Auth layout | [`app/(auth)/layout.tsx`](../../app/(auth)/layout.tsx) |

### Shared utilities

| File | Role |
| --- | --- |
| [`lib/auth/safe-redirect.ts`](../../lib/auth/safe-redirect.ts) | Same-origin redirect sanitization |
| [`lib/auth/onboarding-profile.ts`](../../lib/auth/onboarding-profile.ts) | Cookie bootstrap → `OnboardingProfile` for init |
| [`components/auth/GoogleSignInButton.tsx`](../../components/auth/GoogleSignInButton.tsx) | Google OAuth link builder |

### Onboarding wiring

- [`components/onboarding/OnboardingWizard.tsx`](../../components/onboarding/OnboardingWizard.tsx) — finish → `/auth/signup`
- [`components/onboarding/RootFlowChooser.tsx`](../../components/onboarding/RootFlowChooser.tsx) — “Sign in” → `/auth/login`

## Supabase dashboard (manual)

Add **Redirect URLs** under Authentication → URL Configuration:

- `http://localhost:3000/auth/callback` (local dev)
- `https://<production-host>/auth/callback`

Ensure Google provider is enabled in Supabase Auth providers.

## User flows

### New user

1. `/` → Open onboarding
2. Complete wizard → `/auth/signup` (cookies set via `persistOnboardingCompletion`)
3. Sign up with Google → `/auth/social` → Google → `/auth/callback`
4. Callback calls `initAccountWithUser` with cookie onboarding profile
5. Redirect to `/timeline`

### Returning user

1. `/` → Sign in OR `/auth/login`
2. Google OAuth → callback → `/timeline` (or `next` param)

### Protected routes

Unauthenticated `/captures` → `/auth/login?next=/captures`

## Error codes (`/auth/error`)

| `error` param | When |
| --- | --- |
| `account_deleted` | Soft-deleted user or account on callback |
| `duplicate_user` | Init race / constraint violation |
| `init_account_failed` | Other init failures |
| (default) | Missing OAuth code, session exchange failure |

## Verification checklist

- [ ] Supabase redirect URLs configured
- [ ] `npm run typecheck` && `npm test`
- [ ] New user flow end-to-end (onboarding → signup → Google → timeline)
- [ ] Returning user login → timeline
- [ ] Unauthenticated `/captures` → login with `next`
- [ ] `/` and `/onboarding` work without session
- [ ] DB rows created on first callback (`accounts`, `users`, `permissions`, `credit_balances`)

## Explicitly not in Phase 2

- Email/password, MFA, OTP, invitations
- Stripe runtime, usage enforcement
- Drizzle repositories (Phase 3)
- Settings sign-out UI (Phase 5 — `/auth/logout` route exists)

## Phase review

- [ ] Security — redirect allowlist; no open redirects via `next`
- [ ] Performance — middleware matcher excludes static assets
- [ ] Maintainability — auth routes grouped under `(auth)` layout

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
