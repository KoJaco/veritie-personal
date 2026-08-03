# Phase 6 — Review state, records alignment, polish

## Checklist

- [x] Review states on extracted values (`pending`, `confirmed`, `rejected`, `edited`)
- [x] `POST /api/extracted-values/review` stub mutation
- [x] Timeline drawer confirm/reject actions
- [x] Records route copy uses Record terminology
- [x] `scripts/import-voice-logs.ts` import path

## Verification

- [x] Review actions update stub store via API
- [x] `npm run build`

## Phase review

- [x] Performance: review API is synchronous stub update
- [x] Security: review endpoint validates required fields
- [x] Maintainability: Record vs Capture boundary documented in domain types
