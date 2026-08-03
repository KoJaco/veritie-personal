# Contract: Attachments Model Contract

## Purpose

Define the canonical frontend contract for versioned attachments:

- stable attachment root identity
- auditable attachment versions
- root-level relationships to tasks, documents, checks, and resources

## Scope

Included:

- Attachment root artifact shape and lifecycle
- Attachment version shape and lifecycle
- Relationship mapping to tasks and documents
- Read models in `lib/data-source/attachments-read-model.ts`

Out of scope:

- Storage provider implementation details
- Reviewer workflow UX beyond summary status fields
- Data retention policy

## Definitions

- **Attachment root**: Stable artifact identity that persists across revisions.
- **Attachment version**: Append-only revision record with file metadata, validity window, and review state.
- **Document (object)**: Structured program documentation loaded from stub markdown content or backend content.

Documents describe program posture. Attachments provide supporting files linked to tasks, documents, checks, or resources.

## Read Seam

- `AttachmentsReadAdapter.getAttachmentsIndex(count, filters?)`
- `AttachmentsReadAdapter.getAttachmentDetail(id)`
- `AttachmentsReadAdapter.uploadAttachmentVersion(input)`

## Invariants

- Attachment roots remain stable while versions append.
- Index and detail read models expose summary fields only to routes and rail payloads.
- Upload flows append a version to an existing attachment root; they do not create a new public route family.

## References

- Related contracts: `docs/contracts/attachments-route-contract.md`, `docs/contracts/attachments-embedded-display-contract.md`, `docs/contracts/page-model-contract.md`
