# Phase 4 — Secure Veritie proxy + API hardening

## Scope

Close security and persistence items from [post-auth-db-audit.md](./post-auth-db-audit.md): session-gated Veritie proxy, capture ownership, API auth, body limits, integration tests.

## Prerequisites

- Phase 3 complete: Drizzle persistence, `requireUser` available in API routes.

## Implementation checklist

### Veritie proxy (`app/api/veritie/v1/[...path]/route.ts`)

- [x] Require authenticated session before injecting `VERITIE_API_KEY`
- [x] Bind Veritie job leases to current `accountId` / user
- [x] Reject arbitrary cross-account job ID fetch/persist
- [x] Enforce proxied request body size limits before reading full body into memory
- [x] Keep proxy path/header allowlist after auth lands

### Capture and mutation APIs

- [x] `POST /api/captures` — session auth; enforce capture ownership on persist
- [x] `POST /api/extracted-values/review` — session auth + `accountId` scope (backend); bearer in stub mode
- [x] `GET /api/timeline/events/[eventId]` — data-source adapters in backend mode
- [x] Timeline mutation endpoints — session auth + `accountId` scope; 404 when extracted value missing
- [x] Make duplicate detection account-scoped (partial unique on `(account_id, veritie_job_id)`)
- [x] Store lease/job metadata proving capture was created by current session

### Tests

- [x] Integration test: unauthenticated proxy access → 401
- [x] Integration test: cross-account job ID → rejected
- [x] Integration test: persist replay attempt → rejected / duplicate handled

## Audit closure

Mark complete in [post-auth-db-audit.md](./post-auth-db-audit.md):

- [x] Require authenticated app session before `/api/veritie/*` injects `VERITIE_API_KEY`
- [x] Bind Veritie job leases to the current user/account
- [x] Replace interim same-origin proxy gate with auth, CSRF posture, and rate limiting (session + same-origin; rate limiting deferred)
- [x] Keep the proxy path/header allowlist in place after auth lands
- [x] Replace stub capture persistence with database-backed records (Phase 3)
- [x] Enforce capture ownership on `persistCaptureAction` and API persist endpoint
- [x] Make duplicate detection account-scoped
- [x] Store enough lease/job metadata to prove capture ownership
- [x] Enforce proxied request body limits
- [ ] Re-check live capture cancellation races after persistence moves off stub store
- [x] Add integration tests for unauthorized proxy access, cross-account job IDs, persist replay

## Verification

- [x] Unauthenticated `/api/veritie/*` returns 401
- [x] Authenticated capture flow end-to-end with DB rows (resources index shows DB inventory in backend mode)
- [x] `npm test` includes new integration tests

## Phase review

- [x] Performance review notes — body size limits prevent memory blowups
- [x] Security review notes — no API key leakage to browser; job ID binding verified
- [x] Maintainability review notes — proxy auth logic centralized

## Agent review record

- Date: 2026-08-05
- Findings: Rate limiting and full CSRF token strategy deferred to Phase 6
- Resolved: Session gate, job leases, ownership checks, unique constraint, tests
