import type {
    AttachmentSummaryStub,
    ObjectDetailStub,
    ObjectStub,
    TaskStub,
} from "@/lib/stubs";
import type { ScopeKey } from "@/lib/lens";
import { getAspectLabel } from "@/lib/aspect/definitions";

export interface CheckScope {
    scopeId: ScopeKey;
}

export type CheckReadinessStatus =
    | "complete"
    | "blocked"
    | "at_risk"
    | "unmapped";

export type AggregatedChecksScopeFilter =
    | "all"
    | ScopeKey;

export type AggregatedCheckOwnerState = "assigned" | "missing";

export interface CheckRelatedAttachmentReadModel {
    id: string;
    title: string;
    status: "draft" | "active" | "superseded" | "archived";
    currentVersionNumber: number;
    validUntil?: string;
}

export interface CheckRelatedTaskReadModel {
    id: string;
    title: string;
    status: TaskStub["status"];
    priority: TaskStub["priority"];
    dueAt: string | null;
}

export interface CheckSummaryReadModel {
    id: string;
    title: string;
    summary: string;
    domain: string;
    scopeId: ScopeKey;
    scopeLabel: string;
    readiness: CheckReadinessStatus;
    linkedAttachmentCount: number;
    linkedTasksCount: number;
    missingAttachmentCount: number;
    updatedAt: string;
}

export interface AggregatedCheckSummaryReadModel
    extends CheckSummaryReadModel {
    ownerName: string;
    ownerState: AggregatedCheckOwnerState;
    detailHref: string;
}

export interface CheckIndexReadModel {
    items: CheckSummaryReadModel[];
    summary: {
        totalChecks: number;
        completeChecks: number;
        atRiskChecks: number;
        blockedChecks: number;
        unmappedChecks: number;
        missingAttachments: number;
    };
}

export interface CheckDetailReadModel extends CheckSummaryReadModel {
    description: string;
    ownerName: string;
    version: number;
    status: ObjectStub["status"];
    relatedAttachments: CheckRelatedAttachmentReadModel[];
    relatedTasks: CheckRelatedTaskReadModel[];
}

export interface AggregatedChecksQuery {
    search?: string;
    scope?: AggregatedChecksScopeFilter;
    readiness?: CheckReadinessStatus[];
    ownerState?: AggregatedCheckOwnerState[];
}

export interface AggregatedChecksReadModel {
    items: AggregatedCheckSummaryReadModel[];
    summary: CheckIndexReadModel["summary"];
    availableScopes: AggregatedChecksScopeFilter[];
    availableReadiness: CheckReadinessStatus[];
    availableOwnerStates: AggregatedCheckOwnerState[];
    appliedQuery: Required<AggregatedChecksQuery>;
}

export function checkScopeLabel(scope: CheckScope): string {
    return getAspectLabel(scope.scopeId);
}

export function checkScopeFilterKey(
    scope: CheckScope,
): AggregatedChecksScopeFilter {
    return scope.scopeId;
}

export function checkDetailHref(_scope: CheckScope, _id: string): string {
    return "/timeline";
}

export function mapCheckStubToSummary(
    control: ObjectStub,
    scope: CheckScope,
): CheckSummaryReadModel {
    return {
        id: control.id,
        title: control.title,
        summary: control.summary,
        domain: control.domain,
        scopeId: scope.scopeId,
        scopeLabel: checkScopeLabel(scope),
        readiness: mapCoverageStatus(control.coverageStatus),
        linkedAttachmentCount: control.linkedAttachmentCount,
        linkedTasksCount: control.linkedTasksCount,
        missingAttachmentCount: control.missingAttachmentCount,
        updatedAt: control.updatedAt,
    };
}

export function mapCheckDetailStub(
    control: ObjectDetailStub,
    scope: CheckScope,
): CheckDetailReadModel {
    return {
        ...mapCheckStubToSummary(control, scope),
        description: control.purpose ?? control.summary,
        ownerName: control.owner.name,
        version: control.version,
        status: control.status,
        relatedAttachments: control.linkedAttachments.map(mapRelatedEvidence),
        relatedTasks: control.linkedTasks.map(mapRelatedTask),
    };
}

export function summarizeChecks(
    items: CheckSummaryReadModel[],
): CheckIndexReadModel["summary"] {
    return {
        totalChecks: items.length,
        completeChecks: items.filter((item) => item.readiness === "complete")
            .length,
        atRiskChecks: items.filter((item) => item.readiness === "at_risk")
            .length,
        blockedChecks: items.filter((item) => item.readiness === "blocked")
            .length,
        unmappedChecks: items.filter((item) => item.readiness === "unmapped")
            .length,
        missingAttachments: items.reduce(
            (total, item) => total + item.missingAttachmentCount,
            0,
        ),
    };
}

export function sortChecksByBrokenness<T extends CheckSummaryReadModel>(
    items: T[],
): T[] {
    const rank = (readiness: CheckReadinessStatus) => {
        if (readiness === "blocked") return 0;
        if (readiness === "unmapped") return 1;
        if (readiness === "at_risk") return 2;
        return 3;
    };

    return [...items].sort((left, right) => {
        const readinessDelta = rank(left.readiness) - rank(right.readiness);
        if (readinessDelta !== 0) return readinessDelta;

        if (left.missingAttachmentCount !== right.missingAttachmentCount) {
            return right.missingAttachmentCount - left.missingAttachmentCount;
        }

        const updatedDelta =
            Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
        if (updatedDelta !== 0) return updatedDelta;

        return left.title.localeCompare(right.title);
    });
}

function mapCoverageStatus(
    status: ObjectStub["coverageStatus"],
): CheckReadinessStatus {
    return status;
}

function mapRelatedEvidence(
    attachment: AttachmentSummaryStub,
): CheckRelatedAttachmentReadModel {
    return {
        id: attachment.id,
        title: attachment.filename.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]/g, " "),
        status: mapAttachmentStatus(attachment.status),
        currentVersionNumber: 1,
    };
}

function mapRelatedTask(task: TaskStub): CheckRelatedTaskReadModel {
    return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
    };
}

function mapAttachmentStatus(
    status: AttachmentSummaryStub["status"],
): CheckRelatedAttachmentReadModel["status"] {
    if (status === "accepted" || status === "uploaded") {
        return "active";
    }
    if (status === "expired") {
        return "archived";
    }
    if (status === "requested" || status === "needs_review") {
        return "draft";
    }
    return "superseded";
}
