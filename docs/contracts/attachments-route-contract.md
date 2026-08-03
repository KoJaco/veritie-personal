# Contract: Attachments Route Contract

## Purpose

Define the active route contract boundary for attachment data as it appears inside Work routes.

The platform does not expose a first-class `/work/attachments` index route. Supporting files are modeled as attachments embedded in task, document, resource, scope/check, and connection workflows.

## Scope

Included:

- embedded attachment summaries in route-local page models
- version metadata for attached files
- upload-new-version behavior for an existing attachment root
- generic attachment API route names

Out of scope:

- a top-level attachment index route
- raw file storage
- backend persistence details

## Active API Boundary

Current generic endpoint:

- `POST /api/attachments/versions`

Active client and adapter paths:

- `lib/attachments/upload-attachment-version-client.ts`
- `getDataSourceAdapters().attachments`

## Contract Shape

### Upload Attachment Version Input

- `attachmentId: string`
- `fileName: string`
- `title?: string`
- `description?: string`
- `kind?: string`
- `mimeType?: string`
- `sizeBytes?: number`
- `validFrom?: string`
- `validUntil?: string`

### Upload Attachment Version Result

- `attachmentId: string`
- `versionId: string`
- `versionNumber: number`

## Invariants

- Attachment data in rail and page-model contracts stays summary-only.
- Raw markdown, raw files, and unbounded version arrays do not enter rail payloads.
- Active Work routes must not link to retired route families such as `/work/evidence`.

## References

- Related contracts: `docs/contracts/attachments-model-contract.md`, `docs/contracts/page-model-contract.md`, `docs/contracts/context-rail-contract.md`
