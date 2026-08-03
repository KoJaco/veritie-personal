# Phase 6 — Verification + branch review

## Scope

CI verification, manual E2E, security review, documentation updates. Final gate before merge.

## Prerequisites

- Phases 0–5 complete (or explicitly deferred items documented).

## CI verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## Manual E2E

- [ ] New user: `/` → `/onboarding` → `/auth/signup` → Google → `/timeline`
- [ ] Returning user: `/` or `/auth/login` → Google → `/timeline`
- [ ] Unauthenticated `/captures` → `/auth/login?next=/captures`
- [ ] Voice capture → persist → visible on timeline and captures routes
- [ ] Settings: profile data, sign out, delete account flow
- [ ] Deleted account cannot re-enter app

## Security review

- [ ] RLS spot-check: cross-account read blocked with user JWT
- [ ] OAuth redirect allowlist: no open redirect via `next` param
- [ ] No `SUPABASE_SECRET_KEY` or `VERITIE_API_KEY` in client bundle
- [ ] `/api/veritie/*` requires session
- [ ] Capture persist enforces `accountId` ownership

## Documentation updates

- [ ] [post-auth-db-audit.md](./post-auth-db-audit.md) — mark items complete (or note exceptions)
- [ ] [capture-flow.md](../architecture/capture-flow.md) — auth boundary on proxy/persist
- [ ] `.env.example` — Supabase + DB vars documented
- [ ] [README.md](./README.md) — phase status notes if needed

## Phase review

- [ ] Performance review notes — no regressions on page load with auth middleware
- [ ] Security review notes — checklist above complete
- [ ] Maintainability review notes — stub vs backend data source documented

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending

## Branch merge checklist

- [ ] All phase checklists reviewed
- [ ] No secrets committed
- [ ] Migrations applied on target Supabase project
- [ ] Google OAuth redirect URLs include production callback URL
