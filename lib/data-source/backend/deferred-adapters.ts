import type { AggregatedChecksReadModel } from "../checks-read-model";
import type { CheckDetailReadModel, CheckIndexReadModel } from "../checks-read-model";
import type { CheckScope } from "../checks-read-model";
import type {
    AttachmentDetailReadModel,
    AttachmentIndexReadModel,
} from "../attachments-read-model";
import type {
    ConnectionDetailReadModel,
    ConnectionsIndexReadModel,
} from "../connections-read-model";
import type { ObjectsIndexReadModel } from "../objects-read-model";
import type {
    UploadAttachmentVersionInput,
    UploadAttachmentVersionResult,
} from "../types";
import type { ObjectDetailStub, TaskStub, WorkDashboardStub } from "@/lib/stubs";
import type { TaskSummaryStub } from "@/lib/stubs";

const DEFERRED_ASSIGNEE = {
    id: "deferred",
    name: "Unavailable",
    email: "",
    isMe: false,
};

const EMPTY_CHECK_SUMMARY = {
    totalChecks: 0,
    completeChecks: 0,
    atRiskChecks: 0,
    blockedChecks: 0,
    unmappedChecks: 0,
    missingAttachments: 0,
};

export function emptyObjectsIndexReadModel(): ObjectsIndexReadModel {
    return { items: [], availableDomains: [] };
}

export function emptyObjectDetailStub(id: string): ObjectDetailStub {
    const now = new Date().toISOString();

    return {
        id,
        title: "Document not available",
        summary: "Documents are not available in database-backed mode yet.",
        domain: "",
        objectType: "policy",
        status: "draft",
        coverageStatus: "unmapped",
        owner: DEFERRED_ASSIGNEE,
        version: 1,
        linkedTasksCount: 0,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 0,
        updatedAt: now,
        markdownContent:
            "# Document not available\n\nDatabase-backed documents are not implemented yet.",
        versionHistory: [],
        linkedTasks: [],
        linkedAttachments: [],
    };
}

export function emptyAttachmentsIndexReadModel(): AttachmentIndexReadModel {
    return {
        items: [],
        summary: {
            totalAttachments: 0,
            activeAttachments: 0,
            expiringSoon: 0,
            needsReview: 0,
        },
    };
}

export function emptyAttachmentDetailReadModel(id: string): AttachmentDetailReadModel {
    const now = new Date().toISOString();

    return {
        id,
        accountId: "",
        title: "Attachment not available",
        kind: "other",
        collectionMethod: "manual",
        status: "draft",
        createdAt: now,
        createdByUserId: "",
        updatedAt: now,
        updatedByUserId: "",
        currentVersion: {
            id: "deferred-version",
            versionNumber: 1,
            status: "draft",
            uploadedAt: now,
            uploadedByUserId: "",
            uploadedByName: "Unavailable",
        },
        versions: [],
        attachedTasks: [],
        attachedObjects: [],
        derivedChecks: [],
        derivedScopes: [],
    };
}

export function emptyAggregatedChecksReadModel(): AggregatedChecksReadModel {
    return {
        items: [],
        summary: EMPTY_CHECK_SUMMARY,
        availableScopes: ["all"],
        availableReadiness: [],
        availableOwnerStates: [],
        appliedQuery: {
            search: "",
            scope: "all",
            readiness: [],
            ownerState: [],
        },
    };
}

export function emptyChecksForScopeReadModel(): CheckIndexReadModel {
    return {
        items: [],
        summary: EMPTY_CHECK_SUMMARY,
    };
}

export function emptyCheckDetailReadModel(
    scope: CheckScope,
    id: string,
): CheckDetailReadModel {
    const now = new Date().toISOString();

    return {
        id,
        title: "Check not available",
        summary: "Checks are not available in database-backed mode yet.",
        domain: "",
        scopeId: scope.scopeId,
        scopeLabel: scope.scopeId,
        readiness: "unmapped",
        linkedAttachmentCount: 0,
        linkedTasksCount: 0,
        missingAttachmentCount: 0,
        updatedAt: now,
        description: "",
        ownerName: "Unavailable",
        version: 1,
        status: "draft",
        relatedAttachments: [],
        relatedTasks: [],
    };
}

export function emptyConnectionsIndexReadModel(): ConnectionsIndexReadModel {
    return {
        connected: [],
        disconnected: [],
        providerOptions: [],
    };
}

export function emptyConnectionDetailReadModel(id: string): ConnectionDetailReadModel {
    return {
        id,
        key: id,
        label: "Connection not available",
        status: "disconnected",
        healthStatus: "inactive",
        authType: "manual",
        coverageSummary: "Connections are not available in database-backed mode yet.",
        automatedChecks: 0,
        manualChecksRemaining: 0,
        capabilities: [],
        recommendedScopes: [],
        attachmentTypes: [],
        impactSummary: "",
        generatedAttachments: [],
        actionAvailability: {
            canSyncNow: false,
            canReconnect: false,
            canDisconnect: false,
        },
    };
}

export function emptyWorkDashboardStub(): WorkDashboardStub {
    return {
        progressSummary: {
            overallCompletion: 0,
            tasksCompleted: 0,
            tasksTotal: 0,
            attachmentsAccepted: 0,
            attachmentsTotal: 0,
        },
        overdueCount: 0,
        blockedCount: 0,
        dueSoonCount: 0,
        nextActions: [],
        activeWorkstreams: [],
        recentActivity: [],
    };
}

export function deferredUploadAttachmentVersion(
    _input: UploadAttachmentVersionInput,
): UploadAttachmentVersionResult {
    throw new Error(
        "[data-source] backend adapter not implemented for method: attachments.uploadAttachmentVersion",
    );
}

export function emptyDashboardTasks(): TaskStub[] {
    return [];
}

export function emptyTaskSummaries(): TaskSummaryStub[] {
    return [];
}
