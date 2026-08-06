# Phase 6 — Verification + branch review

## Scope

CI verification, manual E2E, security review, documentation updates. Final gate before merge.

## Prerequisites

- Phases 0–5 complete (or explicitly deferred items documented).

## CI verification

- [x] `npm run typecheck` — 2026-08-06
- [x] `npm run lint` — 0 errors (26 warnings)
- [x] `npm test` — 365 tests
- [x] `npm run build`

## Manual E2E

- [ ] New user: `/` → `/onboarding` → `/auth/signup` → Google → `/timeline` — **manual sign-off** ([phase-6-handoff.md](./phase-6-handoff.md))
- [ ] Returning user: `/` or `/auth/login` → Google → `/timeline` — **manual sign-off**
- [x] Unauthenticated `/captures` → `/auth/login?next=/captures` — `proxy.test.ts`
- [x] Unauthenticated `/api/*` → JSON `401` (not redirect) — `proxy.test.ts`
- [ ] Voice capture → persist → visible on timeline and captures routes — **manual sign-off**
- [x] Settings: profile / delete flows — `settings/__tests__/actions.test.ts` + smoke; full UI **manual sign-off**
- [ ] Deleted account cannot re-enter app — **manual sign-off**

## Security review

- [ ] RLS spot-check: cross-account read blocked with user JWT — **manual SQL**
- [ ] RLS spot-check: direct JWT write blocked — run [`05_verify_privilege.sql`](../../db/rls/05_verify_privilege.sql) after `04` apply
- [x] OAuth redirect allowlist — `safe-redirect.test.ts`
- [x] No server secrets in client bundle — `scripts/phase-6-security-scan.mjs`
- [x] `/api/veritie/*` requires session — route tests
- [x] Unleased job GET returns 403 — route tests
- [x] `/api/chat` and `/api/attachments/versions` return 401 without session — route tests
- [x] Records pages load with `DATABASE_URL` — `records/__tests__/page.test.tsx`
- [x] Capture persist enforces `accountId` ownership — `persist-capture-from-job.test.ts`

## Documentation updates

- [x] [post-auth-db-audit.md](./post-auth-db-audit.md)
- [x] [capture-flow.md](../architecture/capture-flow.md)
- [x] [phase-6-audit-remediation.md](./phase-6-audit-remediation.md)
- [x] `.env.example` — Supabase + DB + `PLATFORM_SHELL_FE_DATA_SOURCE`
- [x] [README.md](./README.md) — phase 6 handoff link
- [x] [phase-6-handoff.md](./phase-6-handoff.md) — verification evidence

## Phase review

- [x] Performance — no new blocking middleware beyond `proxy.ts` session refresh (same as Phase 2)
- [x] Security — automated checklist complete; RLS JWT manual steps in handoff
- [x] Maintainability — stub vs backend documented in `lib/data-source` + handoff

## Agent review record

- Date: 2026-08-06
- Findings: Ten audit items closed in code — see [phase-6-audit-remediation.md](./phase-6-audit-remediation.md)
- Resolved: Automated verification + handoff; OAuth/voice/RLS JWT require merge approver sign-off

## Branch merge checklist

- [x] All phase checklists reviewed
- [x] No secrets committed
- [ ] Migrations applied on target Supabase project — confirm at deploy
- [ ] Google OAuth redirect URLs include production callback URL — confirm at deploy
- [ ] `04_policies_privilege.sql` applied on target Supabase — confirm at deploy
