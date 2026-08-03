# Contract: Evidence Model Contract

## Purpose

Define the canonical frontend/backend contract for a versioned evidence domain:

- stable evidence root identity
- auditable evidence versions
- root-level evidence-to-control mapping
- root-level evidence-to-object supporting relationship mapping
- optional version pinning for audit-period specificity

## Scope

Included:

- Evidence root artifact shape and lifecycle
- Evidence version shape and lifecycle
- Evidence root to control mapping contract
- Evidence root to object mapping contract
- Optional control-level version pin override contract
- Expected table topology for persistence alignment
- Lifecycle/expiry semantics for evidence versions in compliance workflows

Out of scope:

- Storage provider implementation details
- Reviewer workflow UX and audit sign-off procedures
- Data retention policy/legal archival policy

## Branch 14 FE Stub Boundary

- Current frontend branch behavior uses a temporary FE-only write path for evidence revisions.
- That write path exists only to preserve stable evidence root identity and append-only version behavior before backend persistence is connected.
- The temporary FE store/API must not be treated as the final backend contract for storage, tenancy, audit review, or retention semantics.

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible for additive fields
- **Change policy:** Enum or key semantic changes require coordinated contract update across FE + backend

## Definitions

- **Evidence root:** Stable artifact identity that persists across revisions.
- **Evidence version:** Immutable or append-only revision record with file + validity + review state.
- **Evidence-control mapping:** Join record linking an evidence root to a control.
- **Version pin:** Optional override linking a control mapping to a specific evidence version.
- **Object (document artifact):** Structured, versioned program documentation that defines policy/process posture.

Related UI/interaction contract:

- `docs/contracts/evidence-attachment-display-contract.md`

## Objects vs Evidence (Explicit Boundary)

### Evidence

Evidence is **proof that something happened** (execution proof).

Examples:

- Access review export
- Screenshot of MFA enforcement
- Vulnerability scan report

### Objects

Objects are **authoritative documents describing the program** (source-of-truth documentation), not execution proof.

Examples:

- Access Control Policy
- Incident Response Plan
- Vendor Risk Assessment
- Remediation Plan for Control Failure
- Procedures
- Control narratives
- Runbooks
- Security program documentation

### Contract implication

- Evidence is modeled for validity/review/expiry workflows.
- Objects are modeled as structured, versioned documentation artifacts.
- They can be related, but are not interchangeable domain entities.

## Contract Shape (Conceptual)

### Evidence Root

```ts
type EvidenceStatus = "draft" | "active" | "superseded" | "archived";

type EvidenceKind =
    | "policy"
    | "procedure"
    | "report"
    | "export"
    | "screenshot"
    | "log"
    | "attestation"
    | "other";

type EvidenceCollectionMethod = "manual" | "integration" | "generated";

type Evidence = {
    id: string;
    accountId: string;
    title: string;
    description?: string;
    kind: EvidenceKind;
    collectionMethod: EvidenceCollectionMethod;
    status: EvidenceStatus;
    ownerUserId?: string;
    latestVersionId?: string;
    createdAt: string;
    createdByUserId: string;
    updatedAt: string;
    updatedByUserId: string;
    archivedAt?: string;
    archivedByUserId?: string;
};
```

### Evidence Version

```ts
type EvidenceVersionStatus =
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "expired"
    | "superseded";

type EvidenceVersion = {
    id: string;
    accountId: string;
    evidenceId: string;
    versionNumber: number;
    fileId?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    storageKey?: string;
    checksumSha256?: string;
    summary?: string;
    notes?: string;
    validFrom?: string;
    validUntil?: string;
    status: EvidenceVersionStatus;
    sourceLabel?: string;
    uploadedAt: string;
    uploadedByUserId: string;
    approvedAt?: string;
    approvedByUserId?: string;
    supersededByVersionId?: string;
    createdAt: string;
    updatedAt: string;
};
```

### Evidence-Control Map (Root-Level)

```ts
type EvidenceControlMap = {
    id: string;
    accountId: string;
    evidenceId: string;
    controlId: string;
    isPrimary?: boolean;
    mappingNotes?: string;
    createdAt: string;
    createdByUserId: string;
};
```

### Evidence-Object Map (Root-Level Supporting Relationship)

```ts
type EvidenceObjectMap = {
    id: string;
    accountId: string;
    evidenceId: string;
    objectId: string;
    createdAt: string;
    createdByUserId: string;
};
```

### Optional Evidence-Control Version Pin

```ts
type EvidenceControlVersionPin = {
    id: string;
    accountId: string;
    evidenceControlMapId: string;
    evidenceVersionId: string;
    reason?: string;
    createdAt: string;
    createdByUserId: string;
};
```

## Invariants (Must Always Hold)

- Evidence root identity remains stable while versions roll forward.
- File metadata belongs to `EvidenceVersion`, not evidence root.
- Evidence maps to controls at root level by default (`EvidenceControlMap`).
- Evidence can map to objects at root level for supporting-document relationships (`EvidenceObjectMap`).
- Control readiness defaults to latest approved/active evidence version unless explicitly pinned.
- `validFrom`/`validUntil` are version-level validity windows.
- Expired versions are treated as insufficient for control coverage.

## Relationship Topology

Expected relationship flow:

```text
Framework
    ↓
FrameworkControlMap
    ↓
Control
    ↑
EvidenceControlMap
    ↑
Evidence
    ↑
EvidenceVersion
```

Supporting evidence-document relationship:

```text
Object
   ↑
EvidenceObjectMap
   ↑
Evidence
```

Optional audit-period override:

```text
EvidenceControlMap -> EvidenceControlVersionPin -> EvidenceVersion
```

## Suggested Persistence Tables

- `evidence`
- `evidence_version`
- `evidence_control_map`
- `evidence_object_map`
- `evidence_control_version_pin` (optional)
- `controls`
- `framework_control_map`
- `frameworks`
- `files`

## Lifecycle and Expiry

Evidence root lifecycle:

```text
draft -> active -> superseded -> archived
```

Evidence version lifecycle:

```text
draft -> submitted -> approved -> expired
```

Optional path:

```text
submitted -> rejected
```

Supersession path:

```text
approved -> superseded
```

Expiry example:

- Quarterly access review evidence:
    - `validFrom`: `2026-01-01`
    - `validUntil`: `2026-03-31`
- After expiry, relevant controls are treated as missing evidence until refreshed by a new approved version.

## Error Handling

- Invalid evidence payloads fail closed at validation boundaries.
- Invalid mapping records (missing `evidenceId`/`controlId`) are rejected.
- Invalid version payloads (missing `evidenceId`, invalid lifecycle transitions) are rejected.
- Missing file fields are valid for non-file evidence modes (`generated`, `integration`) when supported.

## Operational notes

- MVP can keep collection method effectively `manual` while preserving enum space.
- Optional pinning may remain backend-only initially; UI exposure can be deferred without schema change.
- This contract is designed to support upload/preview now and versioning/audit packaging later without model breaks.

## References

- Related plan: `docs/branch-plan.md` (Branch 13 `feat/evidence-upload-preview`)
- Related contracts: `docs/contracts/scope-matching-contract.md`, `docs/contracts/page-model-contract.md`
- Issue/PR: #
