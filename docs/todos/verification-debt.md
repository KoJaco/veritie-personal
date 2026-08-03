# Verification debt

## Automated

- [x] `npm run typecheck`
- [x] `npm run lint` (pre-existing warnings only; no new errors)
- [x] `npm test` (285 tests)
- [x] `npm run build`

## Manual smoke (voice capture)

Requires a running Veritie runtime with `VERITIE_*` env vars configured.

- [ ] Record voice log end-to-end with Veritie runtime running
- [ ] Confirm capture appears on `/timeline`
- [ ] Confirm `/captures` index shows new capture (stub store)

## Notes

Automated checks passed on 2026-08-03 after Veritie proxy integration. Manual smoke is pending local Veritie runtime availability.
