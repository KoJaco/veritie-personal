# Branch todos — Supabase auth + DB integration

Working checklists for the Supabase auth and database persistence branch. Archived Veritie MVP phase checklists live in [`docs/archive/todos-03-08-2026/`](../archive/todos-03-08-2026/).

## Scope (this branch)

- Supabase Google OAuth (no email/password, MFA, OTP)
- Full multi-tenant identity/RBAC schema (UI hidden; team features in a later branch)
- Drizzle persistence for all domain tables (`capture.ts` + `objects.ts`)
- Hybrid RLS + app-layer `accountId` scoping
- Minimal auth UI at `/auth/*` + basic profile in `/settings`
- Replace stub read models with database-backed adapters
- Secure Veritie proxy and capture persist behind session auth

## User flows

- **New user:** landing `/` → `/onboarding` → `/auth/signup` (Google) → `/auth/callback` → `/timeline`
- **Returning user:** landing `/` or `/auth/login` (Google) → `/auth/callback` → app
- **Protected routes:** unauthenticated access to `app/(app)/*` or `/api/*` → `/auth/login?next=…`

## Out of scope (deferred)

- Multi-tenant UI: users, roles, permissions, invitations, billing, audit log pages
- Email auth, MFA, OTP, password recovery flows
- Stripe webhook runtime, entitlements UI
- Platform admin tables
- Legacy job/media schema from `auth-example/schema.ts`

## Phase checklists

| Phase | File | Focus |
| --- | --- | --- |
| 0 | [phase-0-foundation-auth-db.md](./phase-0-foundation-auth-db.md) | Env, Supabase clients, Drizzle client, schema layout |
| 1 | [phase-1-db-bootstrap-rls.md](./phase-1-db-bootstrap-rls.md) | Migrations, RLS, account bootstrap, `requireUser` |
| 2 | [phase-2-auth-routes-middleware.md](./phase-2-auth-routes-middleware.md) | `/auth/*` routes, middleware, landing/onboarding wiring |
| 3 | [phase-3-drizzle-persistence.md](./phase-3-drizzle-persistence.md) | Replace stub stores with Drizzle repositories |
| 4 | [phase-4-api-hardening.md](./phase-4-api-hardening.md) | Veritie proxy auth, API gates, integration tests |
| 5 | [phase-5-settings-account-ui.md](./phase-5-settings-account-ui.md) | Profile, sign out, delete account in `/settings` |
| 6 | [phase-6-verification.md](./phase-6-verification.md) | CI, E2E, security review, doc updates |

## Supporting checklists

| File | Purpose |
| --- | --- |
| [post-auth-db-audit.md](./post-auth-db-audit.md) | Security and persistence audit items (close in Phase 4) |

## Reference material

| Path | Purpose |
| --- | --- |
| `auth-example/` | Remix auth routes/UI patterns (refactor for Next.js, do not copy directly) |
| `auth-example/schema.ts` | Identity/RBAC schema source (exclude legacy job/media tables) |

## Related docs

- Archived Veritie integration todos: [`docs/archive/todos-03-08-2026/`](../archive/todos-03-08-2026/)
- App restructure plan: [`docs/planning/2026-08-03-voice-log-personal-restructure-plan.md`](../planning/2026-08-03-voice-log-personal-restructure-plan.md)
- Capture flow architecture: [`docs/architecture/capture-flow.md`](../architecture/capture-flow.md)
- SDK: [`sdk/README.md`](../../sdk/README.md)
