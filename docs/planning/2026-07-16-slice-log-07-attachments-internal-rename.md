# Slice 07: Attachments Internal Rename

Date: 2026-07-16

## Summary

Completed the active attachment rename by retiring evidence compatibility
wrappers and moving the upload/data-source/component surface to attachment
terminology.

## Completed

- Removed `POST /api/evidence/versions`.
- Replaced evidence read-model/store exports with
  `attachments-read-model.ts` and `stub-attachment-store.ts`.
- Removed `getDataSourceAdapters().evidence`.
- Renamed the upload component surface to `AttachmentUploadFlow`.
- Updated attachment API/client tests and data-source adapter tests.
- Extended terminology guard coverage for removed evidence compatibility paths.

## Deferred

- Fixture seed files and named IDs still use `ev_*` and evidence-shaped fields
  until fixture normalization.
- Scope/check internals still use control-shaped data-source models.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- Focused Jest for `lib/data-source`, `lib/attachments`, `app/api/attachments`,
  and `components/attachments`
- Full Jest: 68 suites, 327 tests
- `npm run lint` with existing warnings only
- `npm run build`
