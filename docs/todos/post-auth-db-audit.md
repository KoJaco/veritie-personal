# Post auth + DB audit follow-ups

These are audit items from the Veritie integration review that are intentionally deferred until session auth and database persistence land.

## Security boundary

- [ ] Require authenticated app session access before `/api/veritie/*` injects `VERITIE_API_KEY`.
- [ ] Bind Veritie job leases to the current user/account so arbitrary job IDs cannot be fetched or persisted.
- [ ] Replace the interim same-origin proxy gate with auth, CSRF posture, and rate limiting.
- [ ] Keep the proxy path/header allowlist in place after auth lands.

## Persistence

- [ ] Replace stub capture persistence with database-backed records.
- [ ] Enforce capture ownership on `persistCaptureAction` and any API persist endpoint.
- [ ] Make duplicate detection account-scoped, not only Veritie job ID scoped.
- [ ] Store enough lease/job metadata to prove a capture being saved was created by the current app session.

## Production hardening

- [ ] Enforce proxied request body limits before reading the full request body into memory.
- [ ] Re-check live capture cancellation races after persistence moves off the stub store.
- [ ] Add integration tests for unauthorized proxy access, cross-account job IDs, and persist replay attempts.
