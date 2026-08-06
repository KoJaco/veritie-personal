# Phase 2 — Auth routes + middleware (Google only)

## Scope

Next.js `/auth/*` routes (Google OAuth only), middleware session refresh and route protection, landing/onboarding flow wiring. No email/password, MFA, OTP, or invitation flows.

## Prerequisites

- Phase 1 complete: RLS SQL kit, `initAccountWithUser`, `requireUser`, permissions libraries.

## Routes

| Route | Purpose | auth-example reference |
| --- | --- | --- |
| `app/(auth)/auth/login/page.tsx` | Google sign-in + link to onboarding/signup | `_auth.login.tsx` (strip email/password) |
| `app/(auth)/auth/signup/page.tsx` | Google sign-up (post-onboarding) | `_auth.signup.tsx` (social only) |
| `app/(auth)/auth/social/route.ts` | OAuth redirect loader | `_auth.social.tsx` |
| `app/(auth)/auth/callback/route.ts` | `exchangeCodeForSession` + `initAccountWithUser` | `_auth.callback.tsx` |
| `app/(auth)/auth/logout/route.ts` | Sign out | `_auth.logout.tsx` |
| `app/(auth)/auth/error/page.tsx` | Error surface | `_auth.error.tsx` |
| `app/(auth)/layout.tsx` | Auth chrome | `_auth.tsx` |

## Implementation checklist

- [x] `middleware.ts` — refresh session; protect `(app)` and `/api` except `/auth/callback`, `/auth/social`, public assets
- [x] Unauthenticated `app/(app)/*` → redirect `/auth/login?next=…`
- [x] `app/(auth)/auth/login/page.tsx` — Google button, link to onboarding for new users
- [x] `app/(auth)/auth/signup/page.tsx` — Google sign-up (expects onboarding completed first)
- [x] `app/(auth)/auth/social/route.ts` — `signInWithOAuth` with `provider=google`
- [x] `app/(auth)/auth/callback/route.ts` — exchange code, call `initAccountWithUser` if new (onboarding draft from cookies)
- [x] `app/(auth)/auth/logout/route.ts` — `signOut` + redirect
- [x] `app/(auth)/auth/error/page.tsx` — display OAuth/DB errors (incl. deleted account, duplicate user)
- [x] `app/(auth)/layout.tsx` — auth layout chrome
- [x] `app/(site)/page.tsx` — login CTA via RootFlowChooser; keep onboarding entry
- [x] `app/(onboarding)/onboarding/page.tsx` — on completion redirect to `/auth/signup` (sessionStorage + cookies)
- [ ] **Manual:** Supabase redirect URLs for `/auth/callback` (see [phase-2-handoff.md](./phase-2-handoff.md))

## Skip entirely

- `verify-email`, `verify-otp`, `verify-mfa`, `setup-password`, `setup-mfa`
- `forgot-password`, `reset-password`, `password-recovery`, `resend-confirmation`
- `accept-invitation`, `invitation-welcome`, `confirm`

## Security

- [x] OAuth `redirectTo` / `next` allowlist — same-origin paths only (`sanitizeRedirectPath`)
- [ ] Rate limit OAuth start route (optional; deferred)
- [x] No CSRF on GET OAuth routes
- [x] Session cookies: `@supabase/ssr` defaults
- [x] Next.js Route Handlers and Server Components (not Remix loaders)

## Verification

- [ ] New user: landing → onboarding → signup → callback → `/timeline`
- [ ] Returning user: landing → login → callback → `/timeline`
- [ ] Direct `/captures` unauthenticated → `/auth/login?next=/captures`
- [ ] `/` and `/onboarding` remain public without session

## Handoff

See [phase-2-handoff.md](./phase-2-handoff.md) for Supabase config, flows, and error codes.

## Phase review

- [ ] Performance review notes — middleware matcher excludes static assets
- [ ] Security review notes — redirect allowlist; no open redirects
- [ ] Maintainability review notes — auth routes grouped under `(auth)` layout

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
