# Slice 08: Task/Document Relationship Cleanup

Date: 2026-07-16

## Summary

Moved active task and document relationship surfaces from
asset/control/evidence names to resource/check/attachment names.

## Completed

- Task read models now expose `check`, `resource`, `attachments`, and
  `missingAttachmentCount`.
- Task filters use `check` and `resource` query parameters without `control` or
  `asset` compatibility aliases.
- Task detail UI uses `TaskAttachmentsSection` and `TaskResourcesSection`.
- Document detail page models expose supporting attachments.
- Document index sorting uses `missingAttachments`.
- Added guard coverage for retired active task/document relationship field
  names.

## Deferred

- Fixture seed field names such as `linkedEvidenceIds`,
  `missingEvidenceCount`, and `assetId` remain behind adapter boundaries.
- Resource and check detail read models still expose fixture-shaped evidence
  relationships until the fixture/scopes cleanup slices.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- Focused Jest for active `/work/tasks`, `/work/documents`, `/work/resources`,
  `/work/connections`, and `/work/settings` routes
- Full Jest: 68 suites, 327 tests
- `npm run lint` with existing warnings only
- `npm run build`
