# Phase 6 handoff — Verification and merge gate

## What shipped (branch `feat/db-auth-persistence`)

Phases 0–5 plus audit remediation:

- Supabase Google OAuth, Drizzle persistence, hybrid RLS, minimal settings UI
- Session-gated Veritie proxy with owned job leases on all job-scoped paths
- API hardening: session gates, Zod schemas, bounded body reads
- RLS privilege policies (`04_policies_privilege.sql`) including `users_update` / `users_insert` drops
- Proxy JSON `401` for unauthenticated `/api/*`; page routes still redirect to login
- Empty backend adapters for deferred record views; log secret redaction; `server-only` env/logger

## Verification tooling

| Script | Purpose |
| --- | --- |
| `node scripts/phase-6-preflight.mjs` | Env inventory + migration list + Supabase manual steps |
| `node scripts/phase-6-e2e-smoke.mjs` | Jest smoke for proxy, APIs, settings, records, capture persist |
| `node scripts/phase-6-security-scan.mjs` | Grep `.next/static` for server secret key names (run after build) |
| `db/rls/05_verify_privilege.sql` | Post-apply RLS JWT write denial checks |

## Automated verification (2026-08-06)

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors, 26 warnings) |
| `npm test -- --runInBand` | 76 suites, 365 tests pass |
| `npm run build` | Pass |
| `phase-6-e2e-smoke.mjs` | Pass |
| `phase-6-security-scan.mjs` | Pass (no secret key names in client bundles) |
| `phase-6-preflight.mjs` | Required env vars present locally |

## Manual sign-off required (merge approver)

Run with `PLATFORM_SHELL_FE_DATA_SOURCE=backend` and live Veritie stack:

1. **Google OAuth** — new user onboarding → `/timeline`; returning user login
2. **Voice capture** — record → finalize → persist → visible on `/timeline` and `/captures`
3. **Settings** — profile edit, sign out, owner delete account, deleted user blocked on re-login
4. **Supabase RLS** — apply `04_policies_privilege.sql`; run `05_verify_privilege.sql` as user JWT
5. **Cross-account RLS** — second user JWT cannot read another account's `captures`
6. **OAuth redirect URLs** — production host `/auth/callback` in Supabase Google provider
7. **Drizzle migrations** — `0000_overrated_talon`, `0001_mature_old_lace` applied on target project

### Automated substitutes

| Manual E2E item | Automated coverage |
| --- | --- |
| Unauthenticated `/captures` → login redirect | `proxy.test.ts` |
| API `401` without session (not redirect) | `proxy.test.ts` |
| `/api/chat` / attachments `401` | route tests + smoke |
| `/api/veritie/*` session + unleased `403` | veritie route tests + smoke |
| Open redirect on `next` | `safe-redirect.test.ts` |
| Records page with backend adapters | `records/__tests__/page.test.tsx` + smoke |
| Capture persist ownership | `persist-capture-from-job.test.ts` + smoke |
| Settings mutations | `settings/__tests__/actions.test.ts` + smoke |

## Deferred (do not block merge)

- Per-user rate limiting on chat / Veritie proxy
- Capture cancellation race re-check after DB persist ([post-auth-db-audit.md](./post-auth-db-audit.md))
- Playwright/Cypress automation for OAuth flows

## Pre-deploy checklist

- [ ] Open PR: https://github.com/KoJaco/veritie-personal/compare/main...feat/db-auth-persistence
- [ ] GitHub CI green on PR (lint, typecheck, test, build)
- [ ] Apply `db/rls/04_policies_privilege.sql` on production Supabase (if not already)
- [ ] Confirm Google OAuth redirect URLs for production host
- [ ] Confirm migrations applied (`npm run db:migrate` or dashboard)
- [ ] GitHub CI green on PR

## Related

- [phase-6-verification.md](./phase-6-verification.md)
- [phase-6-audit-remediation.md](./phase-6-audit-remediation.md)
