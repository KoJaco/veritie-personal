# Post auth + DB audit follow-ups

These are audit items from the Veritie integration review. Phase 4 closed the proxy/persist security boundary; remaining items are production polish.

## Security boundary

- [x] Require authenticated app session access before `/api/veritie/*` injects `VERITIE_API_KEY`.
- [x] Bind Veritie job leases to the current user/account so arbitrary job IDs cannot be fetched or persisted.
- [x] Replace the interim same-origin proxy gate with auth, CSRF posture, and rate limiting (session auth + same-origin retained; per-user rate limiting deferred).
- [x] Keep the proxy path/header allowlist in place after auth lands.

## Persistence

- [x] Replace stub capture persistence with database-backed records (Phase 3).
- [x] Enforce capture ownership on `persistCaptureAction` and any API persist endpoint.
- [x] Make duplicate detection account-scoped, not only Veritie job ID scoped.
- [x] Store enough lease/job metadata to prove a capture being saved was created by the current app session.

## Production hardening

- [x] Enforce request body limits via bounded reader before buffering untrusted bodies (`lib/api/read-bounded-body.ts`).
- [ ] Re-check live capture cancellation races after persistence moves off the stub store.
- [x] Add integration tests for unauthorized proxy access, cross-account job IDs, and persist replay attempts.
- [x] Phase 6 audit remediation — see [phase-6-audit-remediation.md](./phase-6-audit-remediation.md).
