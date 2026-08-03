# Contract: Evidence Attachment and Display Contract

## Purpose

Lock the frontend contract for evidence browsing, detail display, and attachment flows across task/object/library surfaces.

Canonical route taxonomy for this phase is `/work/*`.
Dashboard route scopings (`/work`, `/library`, `/platform`) are conceptual aliases and are not canonical implementation routes in this contract.

## Architectural Principles

The compliance model is composed of four primitives:

- Tasks: operational work execution
- Evidence: proof artifacts
- Objects: authored compliance documents
- Frameworks: compliance inspection model

## Relationship Model

```txt
Task -> Evidence
Task -> Object

Evidence -> Control
Object -> Control

Evidence -> Object (supporting relationship)

Control -> Framework
```

Rules:

- Framework mappings are always derived through controls.
- Evidence and Objects must never attach directly to frameworks.

## Routing Contract (Canonical)

Primary routes:

```txt
/work/tasks

/work/documents
/work/documents/[objectId]

/work/evidence
/work/evidence/[evidenceId]

/work/scopes
/work/scopes/operations-readiness/checks/[controlId]
/work/scopes/operations-readinessi/checks/[controlId]
/work/scopes/workspace-resilience/checks/[controlId]
```

Object modes:

```txt
/work/documents/[objectId]
/work/documents/[objectId]?mode=edit
/work/documents/[objectId]?mode=history
```

- `default`: rendered document
- `edit`: full editing surface
- `history`: version history

Evidence detail is a single page:

```txt
/work/evidence/[evidenceId]
```

Evidence history is inline (no `?mode=history`).

## Evidence Index Page Contract

Route:

```txt
/work/evidence
```

Purpose:

- global evidence library for browsing and managing proof artifacts

Layout:

- Header
- Summary metrics
- Filter toolbar
- Evidence table

Header contract:

- `PageTitle`
- `PageDescription`
- `UploadEvidenceButton`

Summary metrics contract:

- `totalEvidence`
- `activeEvidence`
- `expiringSoon`
- `needsReview`

Filter toolbar contract:

- `search`
- `evidence type`
- `status`
- `attachedTo` (`task | object | none`)
- `expiry` (`valid | expiring | expired`)

Sort contract:

- Sortable columns:
  - `Valid Until` (`asc | desc`)
  - `Updated` (`asc | desc`)
- Sorting is user-controlled from table header up/down controls.
- Sort state is URL-driven and preserved with lens + active filters.

Evidence table columns:

- Title
- Type
- Related To
- Current Version
- Valid Until
- Updated
- Status

Row behavior:

- click row to open evidence detail
- optional row actions: `open`, `upload new version`, `archive`, `copy link`

## Evidence Detail Page Contract

Route:

```txt
/work/evidence/[evidenceId]
```

Single-column structure:

- `PageHeader`
- `CurrentVersionSurface`
- `RelationsSection`
- `VersionHistorySection`

Header fields:

- `title`
- `type badge`
- `status badge`
- `owner`
- `createdAt`
- quick actions (`Upload new version`, `Archive evidence`)

Current version surface contract:

- single responsive surface containing preview + version metadata
- desktop layout: preview left, metadata right
- mobile/tablet layout: metadata first, preview second
- download action remains at the bottom of the surface

Version metadata fields:

- `versionNumber`
- `fileName`
- `mimeType`
- `size`
- `uploadedBy`
- `uploadedAt`
- `validFrom`
- `validUntil`

Preview behavior:

- `image/*`: inline image preview
- `application/pdf`: embedded PDF viewer
- other MIME: metadata fallback card + download action

Relations fields (read-only in this branch):

- `attachedTasks[]`
- `attachedObjects[]`
- `derivedControls[]`
- `derivedFrameworks[]`

Version history fields:

- `versionNumber`
- `uploadedAt`
- `uploadedBy`
- `validUntil`
- `status`

## Attachment Contracts

Attachment surfaces:

- task detail
- object detail
- evidence library

All surfaces use a shared flow component:

- `EvidenceUploadFlow`

Route-contract adoption in Branch 13:

- evidence routes use route-local contract assembly via `app/(app)/work/evidence/_page-model/*`
- task/object routes remain server-composed in this branch without new local route-contract packages

### Task Evidence Section

Location:

```txt
/work/tasks/[taskId]
```

Contract:

- primary evidence action lives in `PageHeader.actions`
- `AttachedEvidenceList`

List item fields:

- `title`
- `type`
- `currentVersion`
- `validUntil`
- `status`
- `openEvidenceLink`

### Object Supporting Evidence Section

Location:

```txt
/work/documents/[objectId]
```

Contract:

- primary evidence actions live in `PageHeader.actions`
- `EvidenceList`

Section behavior:

- section is display-oriented and renders current supporting evidence state
- section does not own the primary attach/upload CTAs

List item fields:

- `title`
- `type`
- `currentVersion`
- `validUntil`
- `openEvidenceLink`

## Upload Flow Contract

Component:

- `EvidenceUploadFlow`

Context type:

```ts
type EvidenceAttachContext =
    | { kind: "task"; taskId: string; taskTitle: string }
    | { kind: "object"; objectId: string; objectTitle: string }
    | { kind: "library" };
```

Steps:

1. File selection
2. Metadata
3. Review and attach

Step contracts:

- `EvidenceFilePicker`: drag/drop and picker, shows file name/size/type
- `EvidenceMetadataForm`: `title`, `description`, `type`, `validFrom`, `validUntil`
- `EvidenceAttachReview`: context-specific relation summary

Context-specific review behavior:

- task context: target task + derived controls/frameworks
- object context: target object + object mapped controls + derived frameworks
- library context: unattached evidence creation
- task/object page-level upload triggers are rendered in page header actions in the current implementation

Upload success result contract:

- `EvidenceVersion` created
- Evidence relation created for launch context
- UI refreshes
- toast notification shown

## Component Contract Inventory

Pages:

- `EvidenceIndexPage`
- `EvidenceDetailPage`

Evidence components:

- `EvidenceTable`
- `EvidenceRow`
- `EvidenceListItem`
- `EvidencePreview`
- `EvidenceCurrentVersionCard`
- `EvidenceVersionHistory`
- `EvidenceRelationsCard`

Task integration:

- `TaskEvidenceSection`
- `AttachedEvidenceList`

Object integration:

- `ObjectSupportingEvidenceSection`
- `ObjectEvidenceList`

Upload flow:

- `EvidenceUploadFlow`
- `EvidenceFilePicker`
- `EvidenceMetadataForm`
- `EvidenceAttachReview`

Note: names above are interface contracts and do not require exact one-to-one file/component naming.

## Domain Type References

Domain source of truth remains:

- `docs/contracts/evidence-model-contract.md`

This contract consumes:

- `Evidence`
- `EvidenceVersion`
- `EvidenceControlMap`
- `EvidenceObjectMap`

## In Scope / Out of Scope (Branch 13)

In scope:

- Evidence index page
- Evidence detail page
- Evidence upload
- Evidence version history display
- Image/PDF preview
- Attach evidence to tasks
- Attach evidence to objects
- Shared upload flow

Out of scope:

- Manual control selection
- Control picker UI
- Framework control table
- Control detail pages
- Moving baseline upload flows to require control-view pages
- Audit packaging
- Annotation tooling
- Advanced preview tooling

## References

- `docs/contracts/evidence-model-contract.md`
- `docs/contracts/evidence-route-contract.md`
