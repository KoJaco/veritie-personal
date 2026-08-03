# Phase 2 — Auth routes + middleware (Google only)

## Scope

Next.js `/auth/*` routes (Google OAuth only), middleware session refresh and route protection, landing/onboarding flow wiring. No email/password, MFA, OTP, or invitation flows.

## Prerequisites

- Phase 1 complete: migrations, RLS, `requireUser`, account bootstrap.

## Routes

| Route | Purpose | auth-example reference |
| --- | --- | --- |
| `app/(auth)/auth/login/page.tsx` | Google sign-in + link to onboarding/signup | `_auth.login.tsx` (strip email/password) |
| `app/(auth)/auth/signup/page.tsx` | Google sign-up (post-onboarding) | `_auth.signup.tsx` (social only) |
| `app/(auth)/auth/social/route.ts` | OAuth redirect loader | `_auth.social.tsx` |
| `app/(auth)/auth/callback/route.ts` | `exchangeCodeForSession` + DB bootstrap | `_auth.callback.tsx` |
| `app/(auth)/auth/logout/route.ts` | Sign out | `_auth.logout.tsx` |
| `app/(auth)/auth/error/page.tsx` | Error surface | `_auth.error.tsx` |
| `app/(auth)/layout.tsx` | Auth chrome | `_auth.tsx` |

## Implementation checklist

- [ ] `middleware.ts` — refresh session; protect `(app)` and `/api` except `/auth/callback`, `/auth/social`, public assets
- [ ] Unauthenticated `app/(app)/*` → redirect `/auth/login?next=…`
- [ ] `app/(auth)/auth/login/page.tsx` — Google button, link to onboarding for new users
- [ ] `app/(auth)/auth/signup/page.tsx` — Google sign-up (expects onboarding completed first)
- [ ] `app/(auth)/auth/social/route.ts` — `signInWithOAuth` with `provider=google`
- [ ] `app/(auth)/auth/callback/route.ts` — exchange code, bootstrap account if new, redirect to `next`
- [ ] `app/(auth)/auth/logout/route.ts` — `signOut` + redirect
- [ ] `app/(auth)/auth/error/page.tsx` — display OAuth/DB errors (incl. deleted account)
- [ ] `app/(auth)/layout.tsx` — auth layout chrome
- [ ] `app/(site)/page.tsx` — add login CTA; keep onboarding entry
- [ ] `app/(onboarding)/onboarding/page.tsx` — on completion redirect to `/auth/signup` (sessionStorage until DB-backed)

## Skip entirely

- `verify-email`, `verify-otp`, `verify-mfa`, `setup-password`, `setup-mfa`
- `forgot-password`, `reset-password`, `password-recovery`, `resend-confirmation`
- `accept-invitation`, `invitation-welcome`, `confirm`

## Security

- [ ] OAuth `redirectTo` / `next` allowlist — same-origin paths only
- [ ] Rate limit OAuth start route (optional; port from auth-example presets)
- [ ] No CSRF on GET OAuth routes
- [ ] Session cookies: `@supabase/ssr` defaults; `secure` in production
- [ ] Do not copy Remix loaders blindly — use Next.js Route Handlers and Server Components

## Verification

- [ ] New user: landing → onboarding → signup → callback → `/timeline`
- [ ] Returning user: landing → login → callback → `/timeline`
- [ ] Direct `/captures` unauthenticated → `/auth/login?next=/captures`
- [ ] `/` and `/onboarding` remain public without session

## Phase review

- [ ] Performance review notes — middleware matcher excludes static assets
- [ ] Security review notes — redirect allowlist; no open redirects
- [ ] Maintainability review notes — auth routes grouped under `(auth)` layout

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
