import type { ScopeKey } from "@/lib/lens";
import type { TaskStatus } from "@/lib/stubs";
import type { ScopeLens } from "@/lib/lens";
import { scopeIdsMatchLens } from "@/lib/lens/scope-matching";

export type TaskUiStatus = "open" | "in_progress" | "blocked" | "completed";
export type TaskIndexSegment = "all" | "mine" | "dueSoon" | "overdue";

export interface TaskOwnerSummaryReadModel {
    id: string;
    name: string;
    email: string;
    isMe: boolean;
}

export interface TaskCheckSummaryReadModel {
    id: string;
    title: string;
}

export interface TaskResourceSummaryReadModel {
    id: string;
    name: string;
    category: string;
    summary?: string;
}

export interface TaskAttachmentSummaryReadModel {
    id: string;
    title: string;
    kind: string;
    currentVersionNumber: number;
    validUntil?: string;
    status: "draft" | "active" | "superseded" | "archived";
}

export interface TaskDocumentSummaryReadModel {
    id: string;
    title: string;
    kind: "policy" | "procedure" | "check_note";
    href: string;
    updatedAt: string;
}

export interface TaskActivityItemReadModel {
    id: string;
    type:
        | "task_updated"
        | "attachment_uploaded"
        | "attachment_reviewed"
        | "blocker_noted";
    summary: string;
    occurredAt: string;
}

export interface TaskIndexItemReadModel {
    id: string;
    title: string;
    status: TaskUiStatus;
    sourceStatus: TaskStatus;
    dueAt: string | null;
    owner: TaskOwnerSummaryReadModel;
    check: TaskCheckSummaryReadModel;
    scopeLabels: string[];
    scopeIds: ScopeKey[];
    attachmentCount: number;
    missingAttachmentCount: number;
    resource?: TaskResourceSummaryReadModel;
    updatedAt: string;
    isOverdue: boolean;
    blockerSummary?: string;
}

export interface TaskIndexSummaryReadModel {
    open: number;
    dueSoon: number;
    overdue: number;
    completed: number;
    blocked: number;
}

export interface TasksIndexReadModel {
    items: TaskIndexItemReadModel[];
    summary: TaskIndexSummaryReadModel;
    availableOwners: TaskOwnerSummaryReadModel[];
    availableChecks: TaskCheckSummaryReadModel[];
    availableResources: TaskResourceSummaryReadModel[];
}

export interface TasksIndexQuery {
    segment?: TaskIndexSegment;
    lens?: ScopeLens;
    statuses?: TaskUiStatus[];
    ownerIds?: string[];
    checkIds?: string[];
    resourceIds?: string[];
}

export interface TaskDetailReadModel extends TaskIndexItemReadModel {
    description: string;
    checkContext: string;
    documents: TaskDocumentSummaryReadModel[];
    attachments: TaskAttachmentSummaryReadModel[];
    resourceDetail?: TaskResourceSummaryReadModel;
    activity: TaskActivityItemReadModel[];
    blockers: Array<{
        id: string;
        type: "dependency" | "approval" | "resource" | "information";
        description: string;
    }>;
}

export function mapTaskStatusToUi(status: TaskStatus): TaskUiStatus {
    if (status === "done") {
        return "completed";
    }

    if (status === "todo") {
        return "open";
    }

    return status;
}

export function isTaskOverdue(
    dueAt: string | null,
    status: TaskUiStatus,
    now: Date,
): boolean {
    if (!dueAt || status === "completed") {
        return false;
    }

    return new Date(dueAt).getTime() < now.getTime();
}

export function isTaskDueSoon(
    dueAt: string | null,
    status: TaskUiStatus,
    now: Date,
): boolean {
    if (!dueAt || status === "completed") {
        return false;
    }

    const dueAtMs = new Date(dueAt).getTime();
    const diff = dueAtMs - now.getTime();

    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export function summarizeTasksIndex(
    items: TaskIndexItemReadModel[],
    now: Date,
): TaskIndexSummaryReadModel {
    return items.reduce<TaskIndexSummaryReadModel>(
        (summary, item) => {
            if (item.status === "completed") {
                summary.completed += 1;
            } else {
                summary.open += 1;
            }

            if (item.status === "blocked") {
                summary.blocked += 1;
            }

            if (isTaskOverdue(item.dueAt, item.status, now)) {
                summary.overdue += 1;
            } else if (isTaskDueSoon(item.dueAt, item.status, now)) {
                summary.dueSoon += 1;
            }

            return summary;
        },
        {
            open: 0,
            dueSoon: 0,
            overdue: 0,
            completed: 0,
            blocked: 0,
        },
    );
}

export function applyTasksIndexQuery(
    items: TaskIndexItemReadModel[],
    now: Date,
    query?: TasksIndexQuery,
): TasksIndexReadModel {
    const filtered = items.filter((item) => {
        if (query?.segment === "mine" && !item.owner.isMe) {
            return false;
        }

        if (
            query?.segment === "dueSoon" &&
            !isTaskDueSoon(item.dueAt, item.status, now)
        ) {
            return false;
        }

        if (
            query?.segment === "overdue" &&
            !isTaskOverdue(item.dueAt, item.status, now)
        ) {
            return false;
        }

        if (query?.statuses && !query.statuses.includes(item.status)) {
            return false;
        }

        if (query?.ownerIds && !query.ownerIds.includes(item.owner.id)) {
            return false;
        }

        if (query?.checkIds && !query.checkIds.includes(item.check.id)) {
            return false;
        }

        if (query?.lens && !scopeIdsMatchLens(item.scopeIds, query.lens)) {
            return false;
        }

        if (query?.resourceIds && !item.resource) {
            return false;
        }

        if (query?.resourceIds && item.resource && !query.resourceIds.includes(item.resource.id)) {
            return false;
        }

        return true;
    });

    filtered.sort((left, right) => {
        if (left.isOverdue !== right.isOverdue) {
            return left.isOverdue ? -1 : 1;
        }

        if (left.status === "blocked" && right.status !== "blocked") {
            return -1;
        }

        if (left.status !== "blocked" && right.status === "blocked") {
            return 1;
        }

        if (left.dueAt && right.dueAt) {
            return (
                new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()
            );
        }

        if (left.dueAt) {
            return -1;
        }

        if (right.dueAt) {
            return 1;
        }

        return (
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime()
        );
    });

    return {
        items: filtered,
        summary: summarizeTasksIndex(items, now),
        availableOwners: collectOwners(items),
        availableChecks: collectChecks(items),
        availableResources: collectResources(items),
    };
}

function collectOwners(items: TaskIndexItemReadModel[]) {
    const deduped = new Map<string, TaskOwnerSummaryReadModel>();

    for (const item of items) {
        const key = item.owner.isMe
            ? "me"
            : item.owner.email.trim().toLowerCase() ||
              item.owner.name.trim().toLowerCase();
        const existing = deduped.get(key);

        if (!existing) {
            deduped.set(key, item.owner);
            continue;
        }

        if (existing.isMe || !item.owner.isMe) {
            continue;
        }

        deduped.set(key, item.owner);
    }

    return Array.from(deduped.values()).sort((left, right) =>
        left.name.localeCompare(right.name),
    );
}

function collectChecks(items: TaskIndexItemReadModel[]) {
    const deduped = new Map<string, TaskCheckSummaryReadModel>();

    for (const item of items) {
        const key = item.check.title.trim().toLowerCase();

        if (!deduped.has(key)) {
            deduped.set(key, item.check);
        }
    }

    return Array.from(deduped.values()).sort((left, right) =>
        left.title.localeCompare(right.title),
    );
}

function collectResources(items: TaskIndexItemReadModel[]) {
    const deduped = new Map<string, TaskResourceSummaryReadModel>();

    for (const item of items) {
        if (!item.resource) {
            continue;
        }

        const key = item.resource.name.trim().toLowerCase();

        if (!deduped.has(key)) {
            deduped.set(key, item.resource);
        }
    }

    return Array.from(deduped.values()).sort((left, right) =>
        left.name.localeCompare(right.name),
    );
}
