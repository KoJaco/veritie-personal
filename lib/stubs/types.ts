// Core entity types for stub data

import type { ScopeKey } from "@/lib/lens";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type AttachmentStatus =
    | "requested"
    | "uploaded"
    | "needs_review"
    | "accepted"
    | "rejected"
    | "expired";
export type ObjectStatus = "draft" | "in_review" | "approved" | "archived";
export type ObjectCoverageStatus =
    | "complete"
    | "blocked"
    | "at_risk"
    | "unmapped";
export type ObjectType = "policy" | "procedure" | "risk" | "assessment";
export type ConnectionStatus =
    | "disconnected"
    | "connected"
    | "error"
    | "pending"
    | "revoked";
export type AssetCategory = "device" | "service" | "resource" | "entity";
export type AssetCriticality = "low" | "medium" | "high" | "critical";
export type AssetSensitivity = "public" | "internal" | "restricted";
export type ResourceCategory = AssetCategory;
export type ResourceCriticality = AssetCriticality;
export type ResourceSensitivity = AssetSensitivity;

// Task types
export interface TaskStub {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string | null;
    assignee: AssigneeStub;
    relatedObject?: RelatedObjectStub;
    attachmentStatus: "none" | "required" | "missing" | "complete";
    missingAttachmentCount: number;
    updatedAt: string;
    scopeIds?: ScopeKey[];
}

export interface TaskDetailStub extends TaskStub {
    description: string;
    checkContext: string;
    blockers: BlockerStub[];
    linkedAttachments: AttachmentSummaryStub[];
    linkedObjects: RelatedObjectStub[];
}

export interface AssigneeStub {
    id: string;
    name: string;
    email: string;
    isMe: boolean;
}

export interface BlockerStub {
    id: string;
    type: "dependency" | "approval" | "resource" | "information";
    description: string;
}

export interface RelatedObjectStub {
    id: string;
    type: ObjectType;
    title: string;
}

export interface AttachmentSummaryStub {
    id: string;
    filename: string;
    status: AttachmentStatus;
}

// Evidence types
export interface AttachmentStub {
    id: string;
    filename: string;
    fileType: string;
    attachmentType?: string;
    status: AttachmentStatus;
    linkedTaskId?: string;
    linkedTaskTitle?: string;
    linkedObjectId?: string;
    linkedObjectTitle?: string;
    uploadedBy: AssigneeStub;
    uploadedAt: string;
    attachmentDate?: string;
    validFrom?: string;
    validTo?: string;
    source: "manual" | "azure_ad" | "github" | "jira";
    tags?: string[];
    updatedAt: string;
}

export interface AttachmentDetailStub extends AttachmentStub {
    sizeBytes: number;
    summary: string;
    reviewDecision?: {
        decision: "accepted" | "rejected";
        reason?: string;
        reviewedBy: AssigneeStub;
        reviewedAt: string;
    };
    linkedChecks: RelatedObjectStub[];
}

// Object types
export interface ObjectStub {
    id: string;
    title: string;
    summary: string;
    purpose?: string;
    domain: string;
    objectType: ObjectType;
    status: ObjectStatus;
    coverageStatus: ObjectCoverageStatus;
    owner: AssigneeStub;
    version: number;
    linkedTasksCount: number;
    linkedAttachmentCount: number;
    missingAttachmentCount: number;
    updatedAt: string;
    tags?: string[];
    scopeIds?: ScopeKey[];
    relatedTaskId?: string;
}

export interface ObjectDetailStub extends ObjectStub {
    markdownContent?: string;
    versionHistory: VersionStub[];
    linkedTasks: TaskStub[];
    linkedAttachments: AttachmentSummaryStub[];
}

export interface VersionStub {
    number: number;
    createdAt: string;
    createdBy: AssigneeStub;
    changeSummary?: string;
}

// Connection types
export interface ConnectionStub {
    id: string;
    key: string;
    label: string;
    icon: string;
    authType: "oauth" | "api_key" | "manual" | "cloud_role";
    status: ConnectionStatus;
    connectedAt?: string;
    lastSyncedAt?: string;
    connectedBy?: AssigneeStub;
    externalAccountLabel?: string;
    health?: {
        status: "healthy" | "warning" | "error";
        lastError?: string;
        failingResourceCount?: number;
    };
    capabilities: string[];
}

export interface ConnectionAutomationValueStub {
    automatedChecks: number;
    manualChecksRemaining: number;
    attachmentTypes: string[];
    coverageSummary: string;
}

export interface ConnectionCatalogEntryStub extends ConnectionStub {
    automation: ConnectionAutomationValueStub;
    recommendedScopes: string[];
}

export interface AssetCoverageFlags {
    hasOwner: boolean;
    hasAttachments: boolean;
    mappedToChecks: boolean;
    monitored: boolean;
}

export interface ResourceCheckLinkStub {
    id: string;
    title: string;
}

export interface AssetConnectionLinkStub {
    connectionId: string;
    connectionLabel: string;
    connectionKey: string;
    status: ConnectionStatus;
}

export interface AssetTimelineEventStub {
    id: string;
    type:
        | "created"
        | "updated"
        | "scope_mapping_changed"
        | "check_link_changed"
        | "connection_linked"
        | "connection_unlinked";
    occurredAt: string;
    actor: AssigneeStub;
    summary: string;
}

export interface AssetStub {
    id: string;
    name: string;
    category: AssetCategory;
    summary: string;
    owner: AssigneeStub | null;
    criticality: AssetCriticality;
    sensitivity: AssetSensitivity;
    scopeIds: ScopeKey[];
    coverageFlags: AssetCoverageFlags;
    linkedChecksCount: number;
    linkedTasksCount: number;
    linkedAttachmentCount: number;
    linkedConnectionsCount: number;
    updatedAt: string;
}

export interface AssetDetailStub extends AssetStub {
    postureSummary: string;
    linkedChecks: ResourceCheckLinkStub[];
    linkedTasks: TaskStub[];
    linkedAttachments: AttachmentSummaryStub[];
    linkedConnections: AssetConnectionLinkStub[];
    timeline: AssetTimelineEventStub[];
}

export type ResourceCoverageFlags = AssetCoverageFlags;
export type ResourceControlLinkStub = ResourceCheckLinkStub;
export type ResourceConnectionLinkStub = AssetConnectionLinkStub;
export type ResourceTimelineEventStub = AssetTimelineEventStub;
export type ResourceStub = AssetStub;
export type ResourceDetailStub = AssetDetailStub;

// Settings types
export interface ProfileStub {
    name: string;
    email: string;
    role: string;
    lastLoginAt: string;
    workspaceName?: string;
}

export interface TeamMemberStub {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "invited" | "active";
}

export interface RoleCapabilityStub {
    name: string;
    description: string;
}

export interface FrameworkRemediationLinkStub {
    label: string;
    href: string;
}

export interface FrameworkValidationErrorStub {
    id: string;
    title: string;
    detail: string;
    remediation: FrameworkRemediationLinkStub;
}

export interface ScopeMappingConfigStub {
    mappingStatus: "valid" | "invalid";
    topValidationErrors: FrameworkValidationErrorStub[];
}

/** @deprecated Use ScopeMappingConfigStub */
export type Soc2FrameworkConfigStub = ScopeMappingConfigStub;

export interface SettingsStub {
    profile: ProfileStub;
    team: TeamMemberStub[];
    capabilities: RoleCapabilityStub[];
    scopeMapping: ScopeMappingConfigStub;
    /** @deprecated Use scopeMapping */
    frameworkConfiguration: {
        soc2: ScopeMappingConfigStub;
    };
}

// Dashboard/Work types
export interface WorkDashboardStub {
    progressSummary: {
        overallCompletion: number;
        tasksCompleted: number;
        tasksTotal: number;
        attachmentsAccepted: number;
        attachmentsTotal: number;
    };
    overdueCount: number;
    blockedCount: number;
    dueSoonCount: number;
    nextActions: TaskStub[];
    activeWorkstreams: WorkstreamStub[];
    recentActivity: ActivityStub[];
}

export interface WorkstreamStub {
    id: string;
    name: string;
    taskCount: number;
    progress: number;
}

export interface ActivityStub {
    id: string;
    type:
        | "attachment_uploaded"
        | "artifact_version_created"
        | "task_status_changed"
        | "task_completed";
    actor: AssigneeStub;
    timestamp: string;
    target: {
        type: "task" | "attachment" | "object";
        id: string;
        title: string;
    };
    summary: string;
}

export interface ScopeCoverageWindow {
    start: string;
    end: string;
}

export interface ScopeCoverageGap {
    start: string;
    end: string;
    days: number;
    checkIds: string[];
}

export interface ScopeCheckCoverageSnapshot {
    id: string;
    name: string;
    gapDays: number;
    coveredPercent: number;
}

export interface ScopeCoverageTimelineStub {
    window: ScopeCoverageWindow;
    gaps: ScopeCoverageGap[];
    checkCoverage: ScopeCheckCoverageSnapshot[];
}

/** @deprecated Use ScopeCoverageWindow */
export type Soc2TypeIiWindow = ScopeCoverageWindow;

/** @deprecated Use ScopeCoverageGap */
export type Soc2TypeIiCoverageGap = ScopeCoverageGap;

/** @deprecated Use ScopeCheckCoverageSnapshot */
export type Soc2TypeIiCriteriaCoverage = ScopeCheckCoverageSnapshot;

/** @deprecated Use ScopeCoverageTimelineStub */
export type Soc2TypeIiTimelineStub = ScopeCoverageTimelineStub;

// Filter/sort types for list routes
export interface TaskFilters {
    status?: TaskStatus[];
    assignee?: "me" | "anyone";
    due?: "overdue" | "due_this_week" | "due_this_month";
    attachments?: "missing_only";
}

export interface AttachmentFilters {
    status?: AttachmentStatus[];
    linked?: "linked" | "unlinked";
    dateRange?: "7" | "30" | "90";
    fileType?: string[];
    source?: string[];
}

export interface ObjectFilters {
    type?: ObjectType[];
    status?: ObjectStatus[];
}

// Task summary for context rail payload
export interface TaskSummaryStub {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string | null;
    relatedObjectTitle?: string;
    blockingReason: string;
}
