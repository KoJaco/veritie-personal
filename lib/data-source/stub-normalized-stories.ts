import { getCurrentUser } from "@/lib/stubs/assignee";
import type { ScopeKey } from "@/lib/lens";
import type {
    ActivityStub,
    AssigneeStub,
    AssetCategory,
    AssetConnectionLinkStub,
    ResourceCheckLinkStub,
    AssetCoverageFlags,
    AssetCriticality,
    AssetSensitivity,
    BlockerStub,
    AttachmentSummaryStub,
    ObjectCoverageStatus,
    ObjectStatus,
    ObjectType,
    TaskPriority,
    TaskStatus,
    TaskStub,
    TaskFilters,
    VersionStub,
} from "@/lib/stubs/types";

type StoryUserId =
    | "user_current"
    | "user_alex_chen"
    | "user_priya_nair"
    | "user_morgan_lee"
    | "user_dana_harper";

type StoryAttachmentKind =
    | "policy"
    | "procedure"
    | "report"
    | "export"
    | "screenshot"
    | "log"
    | "attestation"
    | "other";

type StoryAttachmentArtifactStatus =
    | "draft"
    | "active"
    | "superseded"
    | "archived";

type StoryAttachmentVersionStatus =
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "expired"
    | "superseded";

type StoryAttachmentCollectionMethod = "manual" | "integration" | "generated";

export type StoryLinkMap = {
    taskId: string;
    objectId: string;
    attachmentIds: string[];
    resourceId?: string;
};

export type NormalizedTaskSeed = {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string | null;
    ownerId: StoryUserId;
    relatedObjectId: string;
    attachmentStatus: "none" | "required" | "missing" | "complete";
    missingAttachmentCount: number;
    updatedAt: string;
    scopeIds: ScopeKey[];
    description: string;
    checkContext: string;
    blockers: BlockerStub[];
    linkedAttachmentIds: string[];
    resourceId?: string;
    activity: Array<{
        id: string;
        type:
            | "task_updated"
            | "attachment_uploaded"
            | "attachment_reviewed"
            | "blocker_noted";
        summary: string;
        occurredAt: string;
    }>;
};

export type NormalizedAttachmentVersionSeed = {
    id: string;
    versionNumber: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    validFrom?: string;
    validUntil?: string;
    status: StoryAttachmentVersionStatus;
    uploadedAt: string;
    uploadedByUserId: StoryUserId;
};

export type NormalizedAttachmentSeed = {
    id: string;
    title: string;
    description: string;
    kind: StoryAttachmentKind;
    collectionMethod: StoryAttachmentCollectionMethod;
    status: StoryAttachmentArtifactStatus;
    ownerId: StoryUserId;
    createdAt: string;
    updatedAt: string;
    versions: NormalizedAttachmentVersionSeed[];
    attachedTaskIds: string[];
    attachedObjectIds: string[];
    derivedScopeIds: ScopeKey[];
};

export type NormalizedObjectSeed = {
    id: string;
    title: string;
    summary: string;
    purpose: string;
    domain: string;
    objectType: ObjectType;
    status: ObjectStatus;
    coverageStatus: ObjectCoverageStatus;
    ownerId: StoryUserId;
    version: number;
    updatedAt: string;
    scopeIds: ScopeKey[];
    relatedTaskId?: string;
    linkedTaskIds: string[];
    linkedAttachmentIds: string[];
    missingAttachmentCount: number;
};

export type NormalizedResourceSeed = {
    id: string;
    name: string;
    category: AssetCategory;
    summary: string;
    postureSummary: string;
    ownerId: StoryUserId | null;
    criticality: AssetCriticality;
    sensitivity: AssetSensitivity;
    scopeIds: ScopeKey[];
    coverageFlags: AssetCoverageFlags;
    linkedChecks: ResourceCheckLinkStub[];
    linkedTaskIds: string[];
    linkedAttachments: Array<{ id: string; filename: string }>;
    linkedConnections?: AssetConnectionLinkStub[];
    updatedAt: string;
};

export type StoryCheckScope = {
    scopeId: import("@/lib/lens").ScopeKey;
};

export type NormalizedTaskImpactSeed = {
    taskId: string;
    dependentCheckCount: number;
    impactSummary: string;
};

export type NormalizedDashboardWorkstreamSeed = {
    id: string;
    title: string;
    summary: string;
    statusNote: string;
    scopeIds: ScopeKey[];
    taskIds: string[];
    primaryTaskId: string;
    objectId: string;
    attachmentId: string;
    resourceId?: string;
    checkTarget?: {
        id: string;
        scope: StoryCheckScope;
    };
};

export type NormalizedDashboardActivitySeed = {
    id: string;
    type: ActivityStub["type"];
    actorId: StoryUserId;
    timestamp: string;
    target: ActivityStub["target"];
    summary: string;
    scopeIds: ScopeKey[];
};

const STORY_USERS: Record<StoryUserId, AssigneeStub> = {
    user_current: getCurrentUser(),
    user_alex_chen: {
        id: "user_alex_chen",
        name: "Alex Chen",
        email: "alex.chen@company.com",
        isMe: false,
    },
    user_priya_nair: {
        id: "user_priya_nair",
        name: "Priya Nair",
        email: "priya.nair@company.com",
        isMe: false,
    },
    user_morgan_lee: {
        id: "user_morgan_lee",
        name: "Morgan Lee",
        email: "morgan.lee@company.com",
        isMe: false,
    },
    user_dana_harper: {
        id: "user_dana_harper",
        name: "Dana Harper",
        email: "dana.harper@company.com",
        isMe: false,
    },
};

function version(
    seed: Omit<NormalizedAttachmentVersionSeed, "uploadedByUserId"> & {
        uploadedByUserId?: StoryUserId;
    },
): NormalizedAttachmentVersionSeed {
    return {
        uploadedByUserId: seed.uploadedByUserId ?? "user_current",
        ...seed,
    };
}

const OBJECT_SEEDS: NormalizedObjectSeed[] = [
    {
        id: "policy-access-governance",
        title: "Policy: Access Control",
        summary:
            "Approved access governance policy covering provisioning, privileged access, and quarterly review expectations.",
        purpose:
            "Defines the access governance requirements that reviewers and check owners rely on for provisioning and certification attachment.",
        domain: "Access Management",
        objectType: "policy",
        status: "approved",
        coverageStatus: "complete",
        ownerId: "user_dana_harper",
        version: 3,
        updatedAt: "2026-03-29T09:00:00.000Z",
        scopeIds: ["admin", "work", "fitness"],
        relatedTaskId: "task-ac-policy-review",
        linkedTaskIds: ["task-ac-policy-review"],
        linkedAttachmentIds: ["att_policy_packet", "att_versioned"],
        missingAttachmentCount: 0,
    },
    {
        id: "check-narrative",
        title: "Check Narrative: Access Provisioning",
        summary:
            "Provisioning workflow narrative aligned to access approvals, MFA enforcement, and reviewer attachment requirements.",
        purpose:
            "Documents how provisioning approvals, reviewer checks, and identity platform settings operate for the access control.",
        domain: "Identity and Access",
        objectType: "procedure",
        status: "approved",
        coverageStatus: "at_risk",
        ownerId: "user_alex_chen",
        version: 4,
        updatedAt: "2026-04-06T14:10:00.000Z",
        scopeIds: ["admin", "work"],
        relatedTaskId: "task-access-provisioning-validation",
        linkedTaskIds: ["task-access-provisioning-validation"],
        linkedAttachmentIds: ["att_detail", "att_api_1"],
        missingAttachmentCount: 1,
    },
    {
        id: "gap-analysis-standards",
        title: "Gap Analysis: Standards Coverage (Table Stress Test)",
        summary:
            "Tracked access and asset-management gaps with open remediation dates awaiting owner confirmation.",
        purpose:
            "Captures unresolved standards deltas so remediation tasks and supporting attachments can be prioritised credibly.",
        domain: "Governance and Risk",
        objectType: "assessment",
        status: "in_review",
        coverageStatus: "blocked",
        ownerId: "user_priya_nair",
        version: 2,
        updatedAt: "2026-04-05T11:35:00.000Z",
        scopeIds: ["fitness"],
        relatedTaskId: "task-iso-gap-remediation",
        linkedTaskIds: ["task-iso-gap-remediation"],
        linkedAttachmentIds: ["att_iso_gap_register"],
        missingAttachmentCount: 2,
    },
    {
        id: "remediation-plan-90-days",
        title: "Remediation Plan: 30/60/90 Days",
        summary:
            "Working remediation plan for access review gaps, policy updates, and platform check follow-through over the next quarter.",
        purpose:
            "Keeps remediation owners, due dates, and check outcomes aligned for the next ninety days of work.",
        domain: "Remediation Program",
        objectType: "risk",
        status: "draft",
        coverageStatus: "at_risk",
        ownerId: "user_morgan_lee",
        version: 2,
        updatedAt: "2026-04-04T16:25:00.000Z",
        scopeIds: ["personal", "admin", "work"],
        relatedTaskId: "task-remediation-program",
        linkedTaskIds: ["task-remediation-program"],
        linkedAttachmentIds: ["att_remediation_status_pack"],
        missingAttachmentCount: 1,
    },
    {
        id: "attachment-mapping-summary",
        title: "Attachment Mapping Summary",
        summary:
            "Coverage workbook showing which check narratives have current attachment, where versions are stale, and what is still missing.",
        purpose:
            "Provides review-ready traceability between active tasks, supporting attachments, and the checks they satisfy.",
        domain: "Attachment Operations",
        objectType: "assessment",
        status: "approved",
        coverageStatus: "at_risk",
        ownerId: "user_current",
        version: 3,
        updatedAt: "2026-04-03T12:20:00.000Z",
        scopeIds: ["admin", "work", "personal"],
        relatedTaskId: "task-attachment-coverage-reconciliation",
        linkedTaskIds: ["task-attachment-coverage-reconciliation"],
        linkedAttachmentIds: ["att_mapping_matrix"],
        missingAttachmentCount: 2,
    },
    {
        id: "config-snippet",
        title: "Config Snippet: YAML/JSON Code Blocks",
        summary:
            "Reference hardening export used to confirm baseline settings before the check attachment set is marked complete.",
        purpose:
            "Supplies the implementation snapshot used to validate platform hardening attachment against the documented baseline.",
        domain: "Platform Security",
        objectType: "procedure",
        status: "approved",
        coverageStatus: "complete",
        ownerId: "user_current",
        version: 2,
        updatedAt: "2026-04-06T09:15:00.000Z",
        scopeIds: ["personal", "fitness"],
        relatedTaskId: "task-config-hardening-review",
        linkedTaskIds: ["task-config-hardening-review"],
        linkedAttachmentIds: ["att_config_baseline"],
        missingAttachmentCount: 0,
    },
];

const TASK_SEEDS: NormalizedTaskSeed[] = [
    {
        id: "task-ac-policy-review",
        title: "Review access control policy attestation package",
        status: "done",
        priority: "high",
        dueAt: "2026-03-28T00:00:00.000Z",
        ownerId: "user_dana_harper",
        relatedObjectId: "policy-access-governance",
        attachmentStatus: "complete",
        missingAttachmentCount: 0,
        updatedAt: "2026-03-29T09:00:00.000Z",
        scopeIds: ["admin", "work", "fitness"],
        description:
            "Confirm the approved access control policy packet and the latest quarterly review export are ready for reuse in the next audit cycle.",
        checkContext:
            "This policy check is only considered ready when the approved policy packet and the latest access review export are both current and retained together.",
        blockers: [],
        linkedAttachmentIds: ["att_policy_packet", "att_versioned"],
        activity: [
            {
                id: "task-ac-policy-review-updated",
                type: "task_updated",
                summary:
                    "Dana Harper consolidated policy approval notes and reviewer sign-off references.",
                occurredAt: "2026-03-29T09:00:00.000Z",
            },
            {
                id: "task-ac-policy-review-reviewed",
                type: "attachment_reviewed",
                summary:
                    "Quarterly access review export was accepted into the March attachment set.",
                occurredAt: "2026-03-28T16:10:00.000Z",
            },
        ],
    },
    {
        id: "task-access-provisioning-validation",
        title: "Validate access provisioning approvals",
        status: "in_progress",
        priority: "high",
        dueAt: "2026-04-10T00:00:00.000Z",
        ownerId: "user_alex_chen",
        relatedObjectId: "check-narrative",
        attachmentStatus: "complete",
        missingAttachmentCount: 0,
        updatedAt: "2026-04-06T14:10:00.000Z",
        scopeIds: ["admin", "work"],
        description:
            "Validate that provisioning approvals, MFA configuration, and reviewer samples still match the documented access provisioning narrative.",
        checkContext:
            "The access provisioning check remains at risk until the current approval sample and identity platform configuration are confirmed against the narrative.",
        blockers: [],
        linkedAttachmentIds: ["att_detail", "att_api_1"],
        resourceId: "resource_seed_3",
        activity: [
            {
                id: "task-access-provisioning-validation-updated",
                type: "task_updated",
                summary:
                    "Alex Chen reopened the work item to verify the March provisioning approval sample against current workflow settings.",
                occurredAt: "2026-04-06T14:10:00.000Z",
            },
            {
                id: "task-access-provisioning-validation-uploaded",
                type: "attachment_uploaded",
                summary:
                    "Attachment added: Access provisioning approval sample.",
                occurredAt: "2026-04-05T10:45:00.000Z",
            },
        ],
    },
    {
        id: "task-iso-gap-remediation",
        title: "Remediate standards gap register items",
        status: "blocked",
        priority: "critical",
        dueAt: "2026-04-09T00:00:00.000Z",
        ownerId: "user_priya_nair",
        relatedObjectId: "gap-analysis-standards",
        attachmentStatus: "missing",
        missingAttachmentCount: 2,
        updatedAt: "2026-04-05T11:35:00.000Z",
        scopeIds: ["fitness"],
        description:
            "Resolve the outstanding access and asset-management gaps once the affected system owners confirm remediation dates and proof requirements.",
        checkContext:
            "This remediation cannot improve knowledge hygiene until the gap register is paired with owner-confirmed closure dates and supporting implementation attachment.",
        blockers: [
            {
                id: "task-iso-gap-remediation-blocker",
                type: "dependency",
                description:
                    "Waiting on system owners to confirm remediation dates for three open findings.",
            },
        ],
        linkedAttachmentIds: ["att_iso_gap_register"],
        activity: [
            {
                id: "task-iso-gap-remediation-updated",
                type: "task_updated",
                summary:
                    "Priya Nair refreshed the gap register after the standards walkthrough.",
                occurredAt: "2026-04-05T11:35:00.000Z",
            },
            {
                id: "task-iso-gap-remediation-blocked",
                type: "blocker_noted",
                summary:
                    "Waiting on system owners to confirm remediation dates for three open findings.",
                occurredAt: "2026-04-05T11:20:00.000Z",
            },
        ],
    },
    {
        id: "task-remediation-program",
        title: "Update 30/60/90 remediation workstream",
        status: "todo",
        priority: "medium",
        dueAt: "2026-04-15T00:00:00.000Z",
        ownerId: "user_morgan_lee",
        relatedObjectId: "remediation-plan-90-days",
        attachmentStatus: "required",
        missingAttachmentCount: 1,
        updatedAt: "2026-04-04T16:25:00.000Z",
        scopeIds: ["personal", "admin", "work"],
        description:
            "Refresh the remediation plan so the next ninety days of work reflect current ownership, check gaps, and attachment commitments.",
        checkContext:
            "The remediation program only improves posture when near-term actions, owners, and proof requirements remain aligned to the active check gaps.",
        blockers: [],
        linkedAttachmentIds: ["att_remediation_status_pack"],
        activity: [
            {
                id: "task-remediation-program-updated",
                type: "task_updated",
                summary:
                    "Morgan Lee updated the 30/60/90 plan after this week's steering review.",
                occurredAt: "2026-04-04T16:25:00.000Z",
            },
        ],
    },
    {
        id: "task-attachment-coverage-reconciliation",
        title: "Reconcile attachment-to-check coverage map",
        status: "todo",
        priority: "high",
        dueAt: "2026-04-02T00:00:00.000Z",
        ownerId: "user_current",
        relatedObjectId: "attachment-mapping-summary",
        attachmentStatus: "missing",
        missingAttachmentCount: 2,
        updatedAt: "2026-04-03T12:20:00.000Z",
        scopeIds: ["admin", "work", "personal"],
        description:
            "Review the attachment coverage workbook, remove stale mappings, and identify which checks still need a current artifact before the next review.",
        checkContext:
            "This mapping task is overdue because the check coverage view is still missing two current artifacts needed for reviewer confidence.",
        blockers: [],
        linkedAttachmentIds: ["att_mapping_matrix"],
        activity: [
            {
                id: "task-attachment-coverage-reconciliation-updated",
                type: "task_updated",
                summary:
                    "You flagged two stale mappings that still need current attachment owners.",
                occurredAt: "2026-04-03T12:20:00.000Z",
            },
        ],
    },
    {
        id: "task-config-hardening-review",
        title: "Validate hardening baseline configuration export",
        status: "done",
        priority: "medium",
        dueAt: "2026-04-05T00:00:00.000Z",
        ownerId: "user_current",
        relatedObjectId: "config-snippet",
        attachmentStatus: "complete",
        missingAttachmentCount: 0,
        updatedAt: "2026-04-06T09:15:00.000Z",
        scopeIds: ["personal", "fitness"],
        description:
            "Confirm the platform hardening export still matches the documented baseline snippet before the check is carried forward as complete.",
        checkContext:
            "The hardening check reads complete because the current configuration export still matches the approved baseline and no open exceptions remain.",
        blockers: [],
        linkedAttachmentIds: ["att_config_baseline"],
        activity: [
            {
                id: "task-config-hardening-review-updated",
                type: "task_updated",
                summary:
                    "You confirmed the exported hardening baseline still matches the documented check configuration.",
                occurredAt: "2026-04-06T09:15:00.000Z",
            },
            {
                id: "task-config-hardening-review-reviewed",
                type: "attachment_reviewed",
                summary:
                    "Secure baseline configuration export was approved for reuse.",
                occurredAt: "2026-04-06T09:00:00.000Z",
            },
        ],
    },
];

const ATTACHMENT_SEEDS: NormalizedAttachmentSeed[] = [
    {
        id: "att_policy_packet",
        title: "Access control policy approval packet",
        description:
            "Approved access control policy packet with ownership sign-off and current review cadence.",
        kind: "policy",
        collectionMethod: "manual",
        status: "active",
        ownerId: "user_dana_harper",
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-03-28T15:35:00.000Z",
        versions: [
            version({
                id: "att_policy_packet-v3",
                versionNumber: 3,
                fileName: "access_control_policy_v3.pdf",
                mimeType: "application/pdf",
                sizeBytes: 348120,
                validFrom: "2026-01-15",
                validUntil: "2027-01-31",
                status: "approved",
                uploadedAt: "2026-03-28T15:35:00.000Z",
                uploadedByUserId: "user_dana_harper",
            }),
            version({
                id: "att_policy_packet-v2",
                versionNumber: 2,
                fileName: "access_control_policy_v2.pdf",
                mimeType: "application/pdf",
                sizeBytes: 340880,
                validFrom: "2025-01-15",
                validUntil: "2026-01-31",
                status: "superseded",
                uploadedAt: "2025-03-28T15:35:00.000Z",
                uploadedByUserId: "user_dana_harper",
            }),
        ],
        attachedTaskIds: ["task-ac-policy-review"],
        attachedObjectIds: ["policy-access-governance"],
        derivedScopeIds: ["admin", "work", "fitness"],
    },
    {
        id: "att_versioned",
        title: "Quarterly access review export",
        description:
            "Reviewer export covering privileged and workforce access certifications for Q1 2026.",
        kind: "export",
        collectionMethod: "generated",
        status: "active",
        ownerId: "user_dana_harper",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-29T08:40:00.000Z",
        versions: [
            version({
                id: "att_versioned-v2",
                versionNumber: 2,
                fileName: "access_review_export_q1_2026.xlsx",
                mimeType:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                sizeBytes: 182224,
                validFrom: "2026-03-01",
                validUntil: "2026-06-30",
                status: "approved",
                uploadedAt: "2026-03-29T08:40:00.000Z",
                uploadedByUserId: "user_dana_harper",
            }),
            version({
                id: "att_versioned-v1",
                versionNumber: 1,
                fileName: "access_review_export_q4_2025.xlsx",
                mimeType:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                sizeBytes: 176482,
                validFrom: "2025-12-01",
                validUntil: "2026-03-31",
                status: "superseded",
                uploadedAt: "2025-12-30T12:20:00.000Z",
                uploadedByUserId: "user_dana_harper",
            }),
        ],
        attachedTaskIds: ["task-ac-policy-review"],
        attachedObjectIds: ["policy-access-governance"],
        derivedScopeIds: ["admin", "work", "fitness"],
    },
    {
        id: "att_detail",
        title: "Access provisioning approval sample",
        description:
            "Sample of approved provisioning requests demonstrating manager sign-off, system owner approval, and reviewer traceability.",
        kind: "report",
        collectionMethod: "manual",
        status: "active",
        ownerId: "user_alex_chen",
        createdAt: "2026-03-25T11:30:00.000Z",
        updatedAt: "2026-04-05T10:45:00.000Z",
        versions: [
            version({
                id: "att_detail-v2",
                versionNumber: 2,
                fileName: "access_provisioning_approval_sample.pdf",
                mimeType: "application/pdf",
                sizeBytes: 265440,
                validFrom: "2026-03-25",
                validUntil: "2026-05-31",
                status: "approved",
                uploadedAt: "2026-04-05T10:45:00.000Z",
                uploadedByUserId: "user_alex_chen",
            }),
            version({
                id: "att_detail-v1",
                versionNumber: 1,
                fileName: "access_provisioning_approval_sample_v1.pdf",
                mimeType: "application/pdf",
                sizeBytes: 252008,
                validFrom: "2026-02-20",
                validUntil: "2026-04-15",
                status: "superseded",
                uploadedAt: "2026-03-01T09:10:00.000Z",
                uploadedByUserId: "user_alex_chen",
            }),
        ],
        attachedTaskIds: ["task-access-provisioning-validation"],
        attachedObjectIds: ["check-narrative"],
        derivedScopeIds: ["admin", "work"],
    },
    {
        id: "att_api_1",
        title: "Identity workflow configuration snapshot",
        description:
            "Configuration snapshot from the identity platform showing approver routing and MFA enforcement for provisioning workflows.",
        kind: "screenshot",
        collectionMethod: "integration",
        status: "active",
        ownerId: "user_alex_chen",
        createdAt: "2026-03-26T08:20:00.000Z",
        updatedAt: "2026-04-04T13:10:00.000Z",
        versions: [
            version({
                id: "att_api_1-v1",
                versionNumber: 1,
                fileName: "identity_workflow_configuration_snapshot.json",
                mimeType: "application/json",
                sizeBytes: 8452,
                validFrom: "2026-03-26",
                validUntil: "2026-06-30",
                status: "approved",
                uploadedAt: "2026-04-04T13:10:00.000Z",
                uploadedByUserId: "user_alex_chen",
            }),
        ],
        attachedTaskIds: ["task-access-provisioning-validation"],
        attachedObjectIds: ["check-narrative"],
        derivedScopeIds: ["admin", "work"],
    },
    {
        id: "att_iso_gap_register",
        title: "Standards gap register extract",
        description:
            "Working register of the open findings, owner notes, and proposed closure dates.",
        kind: "report",
        collectionMethod: "manual",
        status: "active",
        ownerId: "user_priya_nair",
        createdAt: "2026-03-22T10:05:00.000Z",
        updatedAt: "2026-04-05T11:10:00.000Z",
        versions: [
            version({
                id: "att_iso_gap_register-v1",
                versionNumber: 1,
                fileName: "iso27001_gap_register_april_2026.xlsx",
                mimeType:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                sizeBytes: 93488,
                validFrom: "2026-03-22",
                validUntil: "2026-05-15",
                status: "approved",
                uploadedAt: "2026-04-05T11:10:00.000Z",
                uploadedByUserId: "user_priya_nair",
            }),
        ],
        attachedTaskIds: ["task-iso-gap-remediation"],
        attachedObjectIds: ["gap-analysis-standards"],
        derivedScopeIds: ["fitness"],
    },
    {
        id: "att_remediation_status_pack",
        title: "90-day remediation status update",
        description:
            "Status pack summarising completed work, in-flight actions, and carry-over items for the remediation program.",
        kind: "report",
        collectionMethod: "manual",
        status: "active",
        ownerId: "user_morgan_lee",
        createdAt: "2026-03-30T16:00:00.000Z",
        updatedAt: "2026-04-04T15:45:00.000Z",
        versions: [
            version({
                id: "att_remediation_status_pack-v1",
                versionNumber: 1,
                fileName: "remediation_status_update_april_2026.pdf",
                mimeType: "application/pdf",
                sizeBytes: 191204,
                validFrom: "2026-03-30",
                validUntil: "2026-05-31",
                status: "approved",
                uploadedAt: "2026-04-04T15:45:00.000Z",
                uploadedByUserId: "user_morgan_lee",
            }),
        ],
        attachedTaskIds: ["task-remediation-program"],
        attachedObjectIds: ["remediation-plan-90-days"],
        derivedScopeIds: ["admin", "work", "personal"],
    },
    {
        id: "att_mapping_matrix",
        title: "Attachment mapping workbook",
        description:
            "Working coverage workbook that still needs two stale mappings replaced before reviewer sign-off.",
        kind: "export",
        collectionMethod: "generated",
        status: "draft",
        ownerId: "user_current",
        createdAt: "2026-03-29T12:15:00.000Z",
        updatedAt: "2026-04-03T12:05:00.000Z",
        versions: [
            version({
                id: "att_mapping_matrix-v1",
                versionNumber: 1,
                fileName: "attachment_mapping_workbook_april_2026.xlsx",
                mimeType:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                sizeBytes: 116284,
                status: "submitted",
                uploadedAt: "2026-04-03T12:05:00.000Z",
                uploadedByUserId: "user_current",
            }),
        ],
        attachedTaskIds: ["task-attachment-coverage-reconciliation"],
        attachedObjectIds: ["attachment-mapping-summary"],
        derivedScopeIds: ["admin", "work", "personal"],
    },
    {
        id: "att_config_baseline",
        title: "Secure baseline configuration export",
        description:
            "Current hardening export confirming the documented YAML and JSON baseline remains enforced.",
        kind: "export",
        collectionMethod: "generated",
        status: "active",
        ownerId: "user_current",
        createdAt: "2026-03-31T09:30:00.000Z",
        updatedAt: "2026-04-06T08:55:00.000Z",
        versions: [
            version({
                id: "att_config_baseline-v2",
                versionNumber: 2,
                fileName: "secure_baseline_configuration_export.json",
                mimeType: "application/json",
                sizeBytes: 12482,
                validFrom: "2026-04-01",
                validUntil: "2026-07-31",
                status: "approved",
                uploadedAt: "2026-04-06T08:55:00.000Z",
                uploadedByUserId: "user_current",
            }),
            version({
                id: "att_config_baseline-v1",
                versionNumber: 1,
                fileName: "secure_baseline_configuration_export_v1.json",
                mimeType: "application/json",
                sizeBytes: 12001,
                validFrom: "2026-02-01",
                validUntil: "2026-03-31",
                status: "superseded",
                uploadedAt: "2026-03-01T08:55:00.000Z",
                uploadedByUserId: "user_current",
            }),
        ],
        attachedTaskIds: ["task-config-hardening-review"],
        attachedObjectIds: ["config-snippet"],
        derivedScopeIds: ["personal", "fitness"],
    },
];

const RESOURCE_OVERRIDES: NormalizedResourceSeed[] = [
    {
        id: "resource_seed_3",
        name: "Primary Okta Tenant",
        category: "resource",
        summary:
            "Identity platform tenant used for provisioning approvals, MFA enforcement, and quarterly access certifications.",
        postureSummary:
            "Identity posture is strongest when provisioning samples, workflow configuration, and quarterly access review exports stay aligned to the same tenant context.",
        ownerId: "user_alex_chen",
        criticality: "high",
        sensitivity: "restricted",
        scopeIds: ["admin", "work"],
        coverageFlags: {
            hasOwner: true,
            hasAttachments: true,
            mappedToChecks: true,
            monitored: true,
        },
        linkedChecks: [
            { id: "policy-access-governance", title: "Policy: Access Control" },
            {
                id: "check-narrative",
                title: "Check Narrative: Access Provisioning",
            },
        ],
        linkedTaskIds: [
            "task-ac-policy-review",
            "task-access-provisioning-validation",
        ],
        linkedAttachments: [
            {
                id: "att_versioned",
                filename: "access_review_export_q1_2026.xlsx",
            },
            {
                id: "att_detail",
                filename: "access_provisioning_approval_sample.pdf",
            },
        ],
        updatedAt: "2026-04-06T14:10:00.000Z",
    },
];

const TASK_IMPACT_SEEDS: NormalizedTaskImpactSeed[] = [
    {
        taskId: "task-ac-policy-review",
        dependentCheckCount: 2,
        impactSummary:
            "Keeps the approved access policy and quarterly certification attachment reusable across the access governance story.",
    },
    {
        taskId: "task-access-provisioning-validation",
        dependentCheckCount: 2,
        impactSummary:
            "Aligns provisioning approvals, identity workflow settings, and the check narrative before the next readiness review.",
    },
    {
        taskId: "task-iso-gap-remediation",
        dependentCheckCount: 3,
        impactSummary:
            "Unblocks three open findings that still need owner-confirmed dates and supporting remediation proof.",
    },
    {
        taskId: "task-remediation-program",
        dependentCheckCount: 2,
        impactSummary:
            "Keeps the 30/60/90 remediation plan aligned to the active delivery observability and resilience follow-up work.",
    },
    {
        taskId: "task-attachment-coverage-reconciliation",
        dependentCheckCount: 2,
        impactSummary:
            "Restores reviewer confidence in the check coverage view by replacing stale mappings with current artifacts.",
    },
    {
        taskId: "task-config-hardening-review",
        dependentCheckCount: 1,
        impactSummary:
            "Confirms the approved hardening baseline still matches the exported platform configuration.",
    },
];

const DASHBOARD_WORKSTREAM_SEEDS: NormalizedDashboardWorkstreamSeed[] = [
    {
        id: "ws_access_governance",
        title: "Access governance",
        summary:
            "Policy approval, provisioning approvals, and the identity tenant attachment set now follow one shared access-control story.",
        statusNote:
            "Provisioning validation remains open while the March sample is checked against the current workflow configuration.",
        scopeIds: ["admin", "work", "fitness"],
        taskIds: [
            "task-ac-policy-review",
            "task-access-provisioning-validation",
        ],
        primaryTaskId: "task-access-provisioning-validation",
        objectId: "policy-access-governance",
        attachmentId: "att_detail",
        resourceId: "resource_seed_3",
        checkTarget: {
            id: "check-narrative",
            scope: { scopeId: "admin" },
        },
    },
    {
        id: "ws_standards_remediation",
        title: "Standards gap remediation",
        summary:
            "The gap register, owner dates, and follow-up tasks now point to the same remediation narrative.",
        statusNote:
            "This workstream is blocked until system owners confirm closure dates for the open findings.",
        scopeIds: ["fitness"],
        taskIds: ["task-iso-gap-remediation"],
        primaryTaskId: "task-iso-gap-remediation",
        objectId: "gap-analysis-standards",
        attachmentId: "att_iso_gap_register",
    },
    {
        id: "ws_remediation_program",
        title: "Remediation program",
        summary:
            "The ninety-day plan tracks shared follow-through across delivery observability and resilience uplift work.",
        statusNote:
            "The next plan refresh still needs updated attachment commitments for the in-flight remediation items.",
        scopeIds: ["admin", "work", "personal"],
        taskIds: ["task-remediation-program"],
        primaryTaskId: "task-remediation-program",
        objectId: "remediation-plan-90-days",
        attachmentId: "att_remediation_status_pack",
    },
    {
        id: "ws_attachment_reconciliation",
        title: "Attachment reconciliation",
        summary:
            "Coverage mapping now has a single entry point from the workbook to the overdue task and its supporting object.",
        statusNote:
            "Two stale mappings still need current artifacts before reviewer sign-off can proceed.",
        scopeIds: ["admin", "work", "personal"],
        taskIds: ["task-attachment-coverage-reconciliation"],
        primaryTaskId: "task-attachment-coverage-reconciliation",
        objectId: "attachment-mapping-summary",
        attachmentId: "att_mapping_matrix",
    },
    {
        id: "ws_baseline_hardening",
        title: "Baseline hardening",
        summary:
            "The approved hardening snippet, current export, and the completed verification task now read as one consistent baseline story.",
        statusNote:
            "This bundle is complete and ready to reuse from the resilience and knowledge hygiene views.",
        scopeIds: ["personal", "fitness"],
        taskIds: ["task-config-hardening-review"],
        primaryTaskId: "task-config-hardening-review",
        objectId: "config-snippet",
        attachmentId: "att_config_baseline",
        checkTarget: {
            id: "config-snippet",
            scope: { scopeId: "personal" },
        },
    },
];

const DASHBOARD_ACTIVITY_SEEDS: NormalizedDashboardActivitySeed[] = [
    {
        id: "activity_access_validation",
        type: "task_status_changed",
        actorId: "user_alex_chen",
        timestamp: "2026-04-06T14:10:00.000Z",
        target: {
            type: "task",
            id: "task-access-provisioning-validation",
            title: "Validate access provisioning approvals",
        },
        summary:
            "Alex Chen reopened provisioning validation after comparing the March sample to the current workflow configuration.",
        scopeIds: ["admin", "work"],
    },
    {
        id: "activity_config_complete",
        type: "task_completed",
        actorId: "user_current",
        timestamp: "2026-04-06T09:15:00.000Z",
        target: {
            type: "task",
            id: "task-config-hardening-review",
            title: "Validate hardening baseline configuration export",
        },
        summary:
            "You marked the hardening baseline verification complete after confirming the export still matched the approved snippet.",
        scopeIds: ["personal", "fitness"],
    },
    {
        id: "activity_remediation_pack",
        type: "attachment_uploaded",
        actorId: "user_morgan_lee",
        timestamp: "2026-04-04T15:45:00.000Z",
        target: {
            type: "attachment",
            id: "att_remediation_status_pack",
            title: "90-day remediation status update",
        },
        summary:
            "Morgan Lee uploaded the latest remediation status pack for the 30/60/90 workstream.",
        scopeIds: ["admin", "work", "personal"],
    },
    {
        id: "activity_attachment_map",
        type: "task_status_changed",
        actorId: "user_current",
        timestamp: "2026-04-03T12:20:00.000Z",
        target: {
            type: "task",
            id: "task-attachment-coverage-reconciliation",
            title: "Reconcile attachment-to-check coverage map",
        },
        summary:
            "You flagged two stale mappings in the attachment coverage workbook that still need replacement artifacts.",
        scopeIds: ["admin", "work", "personal"],
    },
    {
        id: "activity_policy_version",
        type: "artifact_version_created",
        actorId: "user_dana_harper",
        timestamp: "2026-03-29T09:00:00.000Z",
        target: {
            type: "object",
            id: "policy-access-governance",
            title: "Policy: Access Control",
        },
        summary:
            "Dana Harper published the latest approved access-control policy packet with updated review references.",
        scopeIds: ["admin", "work", "fitness"],
    },
    {
        id: "activity_policy_review",
        type: "attachment_uploaded",
        actorId: "user_dana_harper",
        timestamp: "2026-03-28T16:10:00.000Z",
        target: {
            type: "attachment",
            id: "att_versioned",
            title: "Quarterly access review export",
        },
        summary:
            "Dana Harper uploaded the Q1 quarterly access review export into the approved access-governance attachment set.",
        scopeIds: ["admin", "work", "fitness"],
    },
    {
        id: "activity_provisioning_sample",
        type: "attachment_uploaded",
        actorId: "user_alex_chen",
        timestamp: "2026-04-05T10:45:00.000Z",
        target: {
            type: "attachment",
            id: "att_detail",
            title: "Access provisioning approval sample",
        },
        summary:
            "Alex Chen added the current provisioning approval sample for reviewer traceability.",
        scopeIds: ["admin", "work"],
    },
    {
        id: "activity_iso_gap",
        type: "task_status_changed",
        actorId: "user_priya_nair",
        timestamp: "2026-04-05T11:35:00.000Z",
        target: {
            type: "task",
            id: "task-iso-gap-remediation",
            title: "Remediate standards gap register items",
        },
        summary:
            "Priya Nair updated the gap register and noted the outstanding dependency on owner-confirmed closure dates.",
        scopeIds: ["fitness"],
    },
];

export const NORMALIZED_TASK_IDS = TASK_SEEDS.map((seed) => seed.id);
export const NORMALIZED_OBJECT_IDS = OBJECT_SEEDS.map((seed) => seed.id);
export const NORMALIZED_ATTACHMENT_IDS = ATTACHMENT_SEEDS.map((seed) => seed.id);
export const NORMALIZED_RESOURCE_IDS = RESOURCE_OVERRIDES.map((seed) => seed.id);
export const NORMALIZED_DASHBOARD_WORKSTREAM_IDS = DASHBOARD_WORKSTREAM_SEEDS.map(
    (seed) => seed.id,
);
export const STORY_LINKS: Record<string, StoryLinkMap> = Object.fromEntries(
    TASK_SEEDS.map((seed) => [
        seed.id,
        {
            taskId: seed.id,
            objectId: seed.relatedObjectId,
            attachmentIds: [...seed.linkedAttachmentIds],
            resourceId: seed.resourceId,
        },
    ]),
);

const TASK_SEED_BY_ID = new Map(TASK_SEEDS.map((seed) => [seed.id, seed]));
const OBJECT_SEED_BY_ID = new Map(OBJECT_SEEDS.map((seed) => [seed.id, seed]));
const ATTACHMENT_SEED_BY_ID = new Map(
    ATTACHMENT_SEEDS.map((seed) => [seed.id, seed]),
);
const RESOURCE_OVERRIDE_BY_ID = new Map(
    RESOURCE_OVERRIDES.map((seed) => [seed.id, seed]),
);
const TASK_IMPACT_BY_ID = new Map(
    TASK_IMPACT_SEEDS.map((seed) => [seed.taskId, seed]),
);
const DASHBOARD_WORKSTREAM_BY_ID = new Map(
    DASHBOARD_WORKSTREAM_SEEDS.map((seed) => [seed.id, seed]),
);
const DASHBOARD_ACTIVITY_BY_ID = new Map(
    DASHBOARD_ACTIVITY_SEEDS.map((seed) => [seed.id, seed]),
);

export function getStoryUser(id: StoryUserId): AssigneeStub {
    return { ...STORY_USERS[id] };
}

export function getNormalizedTaskSeed(
    id: string,
): NormalizedTaskSeed | undefined {
    const seed = TASK_SEED_BY_ID.get(id);
    if (!seed) {
        return undefined;
    }

    return {
        ...seed,
        scopeIds: [...seed.scopeIds],
        blockers: seed.blockers.map((blocker) => ({ ...blocker })),
        linkedAttachmentIds: [...seed.linkedAttachmentIds],
        activity: seed.activity.map((item) => ({ ...item })),
    };
}

export function getNormalizedObjectSeed(
    id: string,
): NormalizedObjectSeed | undefined {
    const seed = OBJECT_SEED_BY_ID.get(id);
    if (!seed) {
        return undefined;
    }

    return {
        ...seed,
        scopeIds: [...seed.scopeIds],
        linkedTaskIds: [...seed.linkedTaskIds],
        linkedAttachmentIds: [...seed.linkedAttachmentIds],
    };
}

export function getNormalizedAttachmentSeed(
    id: string,
): NormalizedAttachmentSeed | undefined {
    const seed = ATTACHMENT_SEED_BY_ID.get(id);
    if (!seed) {
        return undefined;
    }

    return {
        ...seed,
        versions: seed.versions.map((item) => ({ ...item })),
        attachedTaskIds: [...seed.attachedTaskIds],
        attachedObjectIds: [...seed.attachedObjectIds],
        derivedScopeIds: [...seed.derivedScopeIds],
    };
}

export function getNormalizedResourceOverride(
    id: string,
): NormalizedResourceSeed | undefined {
    const seed = RESOURCE_OVERRIDE_BY_ID.get(id);
    if (!seed) {
        return undefined;
    }

    return {
        ...seed,
        scopeIds: [...seed.scopeIds],
        coverageFlags: { ...seed.coverageFlags },
        linkedChecks: seed.linkedChecks.map((item) => ({ ...item })),
        linkedTaskIds: [...seed.linkedTaskIds],
        linkedAttachments: seed.linkedAttachments.map((item) => ({ ...item })),
        linkedConnections: seed.linkedConnections?.map((item) => ({ ...item })),
    };
}

export function getNormalizedTaskImpact(
    taskId: string,
): NormalizedTaskImpactSeed | undefined {
    const seed = TASK_IMPACT_BY_ID.get(taskId);
    if (!seed) {
        return undefined;
    }

    return { ...seed };
}

export function getNormalizedDashboardWorkstream(
    id: string,
): NormalizedDashboardWorkstreamSeed | undefined {
    const seed = DASHBOARD_WORKSTREAM_BY_ID.get(id);
    if (!seed) {
        return undefined;
    }

    return {
        ...seed,
        scopeIds: [...seed.scopeIds],
        taskIds: [...seed.taskIds],
        checkTarget: seed.checkTarget
            ? {
                  id: seed.checkTarget.id,
                  scope: { ...seed.checkTarget.scope },
              }
            : undefined,
    };
}

export function getNormalizedDashboardWorkstreams(): NormalizedDashboardWorkstreamSeed[] {
    return DASHBOARD_WORKSTREAM_SEEDS.map((seed) =>
        getNormalizedDashboardWorkstream(seed.id)!,
    );
}

export function getNormalizedDashboardActivity(
    id: string,
): NormalizedDashboardActivitySeed | undefined {
    const seed = DASHBOARD_ACTIVITY_BY_ID.get(id);
    if (!seed) {
        return undefined;
    }

    return {
        ...seed,
        target: { ...seed.target },
        scopeIds: [...seed.scopeIds],
    };
}

export function getNormalizedDashboardActivities(): NormalizedDashboardActivitySeed[] {
    return DASHBOARD_ACTIVITY_SEEDS.map((seed) =>
        getNormalizedDashboardActivity(seed.id)!,
    ).sort(
        (left, right) =>
            Date.parse(right.timestamp) - Date.parse(left.timestamp),
    );
}

export function getNormalizedTargetScopeIds(
    target: ActivityStub["target"],
): ScopeKey[] {
    if (target.type === "task") {
        return getNormalizedTaskSeed(target.id)?.scopeIds ?? [];
    }

    if (target.type === "object") {
        return getNormalizedObjectSeed(target.id)?.scopeIds ?? [];
    }

    if (target.type === "attachment") {
        const attachment = getNormalizedAttachmentSeed(target.id);
        if (!attachment) {
            return [];
        }

        const taskScopeIds = attachment.attachedTaskIds.flatMap(
            (taskId) => getNormalizedTaskSeed(taskId)?.scopeIds ?? [],
        );
        const objectScopeIds = attachment.attachedObjectIds.flatMap(
            (objectId) => getNormalizedObjectSeed(objectId)?.scopeIds ?? [],
        );

        return Array.from(new Set([...taskScopeIds, ...objectScopeIds]));
    }

    return [];
}

export function getNormalizedDashboardTaskStubs(
    count?: number,
    filters?: TaskFilters,
): TaskStub[] {
    let tasks = NORMALIZED_TASK_IDS.map((id) => getNormalizedTaskStub(id)).filter(
        (task): task is TaskStub => Boolean(task),
    );

    if (filters?.status) {
        tasks = tasks.filter((task) => filters.status!.includes(task.status));
    }

    if (filters?.assignee === "me") {
        tasks = tasks.filter((task) => task.assignee.isMe);
    }

    if (filters?.due === "overdue") {
        const now = Date.parse("2026-04-07T00:00:00.000Z");
        tasks = tasks.filter(
            (task) => task.dueAt !== null && Date.parse(task.dueAt) < now,
        );
    }

    if (filters?.attachments === "missing_only") {
        tasks = tasks.filter((task) => task.attachmentStatus === "missing");
    }

    tasks = tasks.sort((left, right) => {
        const priorityOrder = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
        } satisfies Record<TaskStub["priority"], number>;
        const priorityDelta =
            priorityOrder[left.priority] - priorityOrder[right.priority];

        if (priorityDelta !== 0) {
            return priorityDelta;
        }

        if (left.dueAt && right.dueAt) {
            return Date.parse(left.dueAt) - Date.parse(right.dueAt);
        }

        if (left.dueAt) {
            return -1;
        }

        if (right.dueAt) {
            return 1;
        }

        return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    });

    return typeof count === "number" ? tasks.slice(0, count) : tasks;
}

export function getNormalizedTaskStub(id: string): TaskStub | undefined {
    const task = TASK_SEED_BY_ID.get(id);
    if (!task) {
        return undefined;
    }

    const object = OBJECT_SEED_BY_ID.get(task.relatedObjectId);

    return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
        assignee: getStoryUser(task.ownerId),
        relatedObject: object
            ? {
                  id: object.id,
                  type: object.objectType,
                  title: object.title,
              }
            : undefined,
        attachmentStatus: task.attachmentStatus,
        missingAttachmentCount: task.missingAttachmentCount,
        updatedAt: task.updatedAt,
        scopeIds: [...task.scopeIds],
    };
}

export function getNormalizedAttachmentSummaryStub(
    id: string,
): AttachmentSummaryStub | undefined {
    const attachmentSeed = ATTACHMENT_SEED_BY_ID.get(id);
    if (!attachmentSeed) {
        return undefined;
    }

    const currentVersion = attachmentSeed.versions[0];
    if (!currentVersion) {
        return undefined;
    }

    return {
        id: attachmentSeed.id,
        filename: currentVersion.fileName,
        status: mapArtifactStatusToStubStatus(attachmentSeed.status),
    };
}

export function getNormalizedObjectVersionHistory(
    objectId: string,
): VersionStub[] | undefined {
    const seed = OBJECT_SEED_BY_ID.get(objectId);
    if (!seed) {
        return undefined;
    }

    const versions: VersionStub[] = [];
    for (let versionNumber = seed.version; versionNumber >= 1; versionNumber -= 1) {
        const createdBy =
            versionNumber === seed.version
                ? getStoryUser(seed.ownerId)
                : getStoryUser("user_current");
        const changeSummary =
            versionNumber === seed.version
                ? "Current version"
                : versionNumber === 1
                  ? "Initial version"
                  : "Updated supporting narrative";

        versions.push({
            number: versionNumber,
            createdAt:
                versionNumber === seed.version
                    ? seed.updatedAt
                    : `2026-0${Math.max(1, versionNumber)}-15T09:00:00.000Z`,
            createdBy,
            changeSummary,
        });
    }

    return versions;
}

function mapArtifactStatusToStubStatus(
    status: StoryAttachmentArtifactStatus,
): AttachmentSummaryStub["status"] {
    if (status === "active") {
        return "accepted";
    }

    if (status === "archived") {
        return "expired";
    }

    if (status === "superseded") {
        return "rejected";
    }

    return "needs_review";
}
