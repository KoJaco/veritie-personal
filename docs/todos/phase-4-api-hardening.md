# Phase 4 — Secure Veritie proxy + API hardening

## Scope

Close security and persistence items from [post-auth-db-audit.md](./post-auth-db-audit.md): session-gated Veritie proxy, capture ownership, API auth, body limits, integration tests.

## Prerequisites

- Phase 3 complete: Drizzle persistence, `requireUser` available in API routes.

## Implementation checklist

### Veritie proxy (`app/api/veritie/v1/[...path]/route.ts`)

- [ ] Require authenticated session before injecting `VERITIE_API_KEY`
- [ ] Bind Veritie job leases to current `accountId` / user
- [ ] Reject arbitrary cross-account job ID fetch/persist
- [ ] Enforce proxied request body size limits before reading full body into memory
- [ ] Keep proxy path/header allowlist after auth lands

### Capture and mutation APIs

- [ ] `POST /api/captures` — session auth; enforce capture ownership on persist
- [ ] `POST /api/extracted-values/review` — session auth + `accountId` scope
- [ ] Timeline mutation endpoints — session auth + `accountId` scope
- [ ] Make duplicate detection account-scoped (not only Veritie job ID scoped)
- [ ] Store lease/job metadata proving capture was created by current session

### Tests

- [ ] Integration test: unauthenticated proxy access → 401
- [ ] Integration test: cross-account job ID → rejected
- [ ] Integration test: persist replay attempt → rejected

## Audit closure

Mark complete in [post-auth-db-audit.md](./post-auth-db-audit.md):

- [ ] Require authenticated app session before `/api/veritie/*` injects `VERITIE_API_KEY`
- [ ] Bind Veritie job leases to the current user/account
- [ ] Replace interim same-origin proxy gate with auth, CSRF posture, and rate limiting
- [ ] Keep the proxy path/header allowlist in place after auth lands
- [ ] Replace stub capture persistence with database-backed records
- [ ] Enforce capture ownership on `persistCaptureAction` and API persist endpoint
- [ ] Make duplicate detection account-scoped
- [ ] Store enough lease/job metadata to prove capture ownership
- [ ] Enforce proxied request body limits
- [ ] Re-check live capture cancellation races after persistence moves off stub store
- [ ] Add integration tests for unauthorized proxy access, cross-account job IDs, persist replay

## Verification

- [ ] Unauthenticated `/api/veritie/*` returns 401
- [ ] Authenticated capture flow end-to-end with DB rows
- [ ] `npm test` includes new integration tests

## Phase review

- [ ] Performance review notes — body size limits prevent memory blowups
- [ ] Security review notes — no API key leakage to browser; job ID binding verified
- [ ] Maintainability review notes — proxy auth logic centralized

## Agent review record

- Date: pending
- Findings: pending
- Resolved: pending
