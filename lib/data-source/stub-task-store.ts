import {
    getSeedResourceRecords,
    getTasksStub,
    type AssetCategory,
    type TaskDetailStub,
    type TaskStub,
} from "@/lib/stubs";
import {
    getStubAttachmentDetail,
    getStubAttachmentsIndex,
} from "./stub-attachment-store";
import {
    getNormalizedResourceOverride,
    getNormalizedObjectSeed,
    getNormalizedTaskSeed,
    getStoryUser,
} from "./stub-normalized-stories";
import { aspectIdsToLabels } from "@/lib/aspect/definitions";
import type { AspectKey } from "@/lib/domain/aspect";
import {
    applyTasksIndexQuery,
    isTaskOverdue,
    mapTaskStatusToUi,
    type TaskActivityItemReadModel,
    type TaskResourceSummaryReadModel,
    type TaskDetailReadModel,
    type TaskDocumentSummaryReadModel,
    type TaskAttachmentSummaryReadModel,
    type TaskIndexItemReadModel,
    type TasksIndexQuery,
    type TasksIndexReadModel,
} from "./tasks-read-model";

const INITIAL_TASK_COUNT = 28;
const FIXED_TASK_IDS = [
    "task-ac-policy-review",
    "task-access-provisioning-validation",
    "task-iso-gap-remediation",
    "task-remediation-program",
    "task-attachment-coverage-reconciliation",
    "task-config-hardening-review",
] as const;

type TaskRecord = {
    detail: TaskDetailReadModel;
};

let records: Map<string, TaskRecord> | null = null;
let orderedIds: string[] | null = null;

function ensureStore() {
    if (records && orderedIds) {
        return;
    }

    records = new Map();
    orderedIds = [];

    const seededTasks = getTasksStub(INITIAL_TASK_COUNT).map((task, index) => ({
        ...task,
        id: FIXED_TASK_IDS[index] ?? task.id,
    }));

    for (const task of seededTasks) {
        const detail = buildTaskDetailReadModel(task);
        records.set(detail.id, { detail });
        orderedIds.push(detail.id);
    }
}

function getStore() {
    ensureStore();

    return {
        records: records!,
        orderedIds: orderedIds!,
    };
}

function buildTaskDetailReadModel(task: TaskStub): TaskDetailReadModel {
    const normalizedSeed = getNormalizedTaskSeed(task.id);
    if (normalizedSeed) {
        return buildNormalizedTaskDetail(normalizedSeed);
    }

    const detailStub = buildTaskDetailStub(task);
    const attachments = buildAttachmentsForTask(task.id);
    const resource = buildResourceForTask(task.id);
    const documents = buildDocuments(detailStub);
    const activity = buildActivity(detailStub, attachments);
    const scopeLabels = buildScopeLabels(task.scopeIds);
    const status = mapTaskStatusToUi(task.status);
    const isOverdue = isTaskOverdue(task.dueAt, status, new Date());

    return {
        id: detailStub.id,
        title: detailStub.title,
        status,
        sourceStatus: detailStub.status,
        dueAt: detailStub.dueAt,
        owner: {
            id: detailStub.assignee.id,
            name: detailStub.assignee.name,
            email: detailStub.assignee.email,
            isMe: detailStub.assignee.isMe,
        },
        check: {
            id: detailStub.relatedObject?.id ?? `${detailStub.id}_control`,
            title:
                detailStub.relatedObject?.title ??
                "Check ownership and attachment mapping",
        },
        scopeLabels,
        scopeIds: [...(task.scopeIds ?? [])],
        attachmentCount: attachments.length,
        missingAttachmentCount: detailStub.missingAttachmentCount,
        resource,
        updatedAt: detailStub.updatedAt,
        isOverdue,
        blockerSummary: detailStub.blockers[0]?.description,
        description: detailStub.description,
        checkContext: detailStub.checkContext,
        documents,
        attachments,
        resourceDetail: resource,
        activity,
        blockers: detailStub.blockers.map((blocker) => ({ ...blocker })),
    };
}

function buildNormalizedTaskDetail(
    seed: NonNullable<ReturnType<typeof getNormalizedTaskSeed>>,
): TaskDetailReadModel {
    const object = getNormalizedObjectSeed(seed.relatedObjectId);
    const attachments = buildAttachmentsForTask(seed.id);
    const resource = buildResourceForTask(seed.id);
    const status = mapTaskStatusToUi(seed.status);

    return {
        id: seed.id,
        title: seed.title,
        status,
        sourceStatus: seed.status,
        dueAt: seed.dueAt,
        owner: getStoryUser(seed.ownerId),
        check: {
            id: object?.id ?? `${seed.id}_control`,
            title: object?.title ?? "Check narrative",
        },
        scopeLabels: buildScopeLabels(seed.scopeIds),
        scopeIds: [...seed.scopeIds],
        attachmentCount: attachments.length,
        missingAttachmentCount: seed.missingAttachmentCount,
        resource,
        updatedAt: seed.updatedAt,
        isOverdue: isTaskOverdue(seed.dueAt, status, new Date()),
        blockerSummary: seed.blockers[0]?.description,
        description: seed.description,
        checkContext: seed.checkContext,
        documents: buildDocumentsForNormalizedTask(seed),
        attachments,
        resourceDetail: resource,
        activity: seed.activity.map(mapNormalizedActivityItem),
        blockers: seed.blockers.map((blocker) => ({ ...blocker })),
    };
}

function buildTaskDetailStub(task: TaskStub): TaskDetailStub {
    return {
        ...task,
        description: `Complete ${task.title.toLowerCase()} and attach current review-ready attachment before closing the work item.`,
        checkContext: task.relatedObject
            ? `${task.relatedObject.title} depends on this task being completed with valid supporting attachments.`
            : "This task contributes directly to check readiness in the current scope lens.",
        blockers:
            task.status === "blocked"
                ? [
                      {
                          id: `${task.id}_blocker`,
                          type: "dependency",
                          description:
                              "Waiting on supporting attachments from a dependent owner.",
                      },
                  ]
                : [],
        linkedAttachments: [],
        linkedObjects: task.relatedObject ? [{ ...task.relatedObject }] : [],
    };
}

function buildAttachmentsForTask(taskId: string): TaskAttachmentSummaryReadModel[] {
    const normalized = getNormalizedTaskSeed(taskId);
    if (normalized) {
        return normalized.linkedAttachmentIds.map((attachmentId) => {
            const detail = getStubAttachmentDetail(attachmentId);

            return {
                id: detail.id,
                title: detail.title,
                kind: detail.kind,
                currentVersionNumber: detail.currentVersion.versionNumber,
                validUntil: detail.currentVersion.validUntil,
                status: detail.status,
            };
        });
    }

    const attachmentsIndex = getStubAttachmentsIndex();
    const count = 1 + (hash(taskId) % 2);
    const offset =
        hash(`${taskId}_attachments`) %
        Math.max(1, attachmentsIndex.length - count);

    return attachmentsIndex.slice(offset, offset + count).map((item) => {
        const detail = getStubAttachmentDetail(item.id);

        return {
            id: detail.id,
            title: detail.title,
            kind: detail.kind,
            currentVersionNumber: detail.currentVersion.versionNumber,
            validUntil: detail.currentVersion.validUntil,
            status: detail.status,
        };
    });
}

function buildResourceForTask(taskId: string): TaskResourceSummaryReadModel | undefined {
    const normalized = getNormalizedTaskSeed(taskId);
    if (normalized?.resourceId) {
        const asset = getNormalizedResourceOverride(normalized.resourceId);
        if (asset) {
            return {
                id: asset.id,
                name: asset.name,
                category: assetCategoryLabel(asset.category),
                summary: asset.summary,
            };
        }
    }

    if (hash(taskId) % 3 === 0) {
        return undefined;
    }

    const assets = getSeedResourceRecords();
    const asset = assets[hash(`${taskId}_asset`) % assets.length];

    return {
        id: asset.id,
        name: asset.name,
        category: assetCategoryLabel(asset.category),
        summary: asset.summary,
    };
}

function buildDocuments(detail: TaskDetailStub): TaskDocumentSummaryReadModel[] {
    const baseUpdatedAt = detail.updatedAt;
    const relatedTitle = detail.relatedObject?.title ?? "Check narrative";

    return [
        {
            id: `${detail.id}_policy`,
            title: `${relatedTitle} policy packet`,
            kind: "policy",
            href: detail.relatedObject
                ? `/work/documents/${detail.relatedObject.id}`
                : "/work/documents",
            updatedAt: baseUpdatedAt,
        },
        {
            id: `${detail.id}_procedure`,
            title: `${detail.title} procedure notes`,
            kind: "procedure",
            href: detail.relatedObject
                ? `/work/documents/${detail.relatedObject.id}`
                : "/work/documents",
            updatedAt: baseUpdatedAt,
        },
    ];
}

function buildDocumentsForNormalizedTask(
    seed: NonNullable<ReturnType<typeof getNormalizedTaskSeed>>,
): TaskDocumentSummaryReadModel[] {
    const object = getNormalizedObjectSeed(seed.relatedObjectId);
    const href = object ? `/work/documents/${object.id}` : "/work/documents";
    const primaryTitle = object?.title ?? "Supporting check document";

    return [
        {
            id: `${seed.id}_primary_document`,
            title: primaryTitle,
            kind: mapObjectTypeToDocumentKind(object?.objectType),
            href,
            updatedAt: seed.updatedAt,
        },
        {
            id: `${seed.id}_execution_notes`,
            title: `${seed.title} working notes`,
            kind: "procedure",
            href,
            updatedAt: seed.updatedAt,
        },
    ];
}

function buildActivity(
    detail: TaskDetailStub,
    attachments: TaskAttachmentSummaryReadModel[],
): TaskActivityItemReadModel[] {
    const items: TaskActivityItemReadModel[] = [
        {
            id: `${detail.id}_updated`,
            type: "task_updated",
            summary: `${detail.assignee.name} updated the task execution plan.`,
            occurredAt: detail.updatedAt,
        },
    ];

    if (attachments[0]) {
        items.push({
            id: `${detail.id}_attachment_uploaded`,
            type: "attachment_uploaded",
            summary: `Attachment added: ${attachments[0].title}.`,
            occurredAt: detail.updatedAt,
        });
    }

    if (detail.blockers[0]) {
        items.push({
            id: `${detail.id}_blocker_noted`,
            type: "blocker_noted",
            summary: detail.blockers[0].description,
            occurredAt: detail.updatedAt,
        });
    }

    return items;
}

function mapNormalizedActivityItem(
    item: NonNullable<ReturnType<typeof getNormalizedTaskSeed>>["activity"][number],
): TaskActivityItemReadModel {
    if (item.type === "attachment_uploaded") {
        return {
            ...item,
            type: "attachment_uploaded",
            summary: item.summary.replace(/^Attachment added:/, "Attachment added:"),
        };
    }

    if (item.type === "attachment_reviewed") {
        return {
            ...item,
            type: "attachment_reviewed",
            summary: item.summary.replace(/\bevidence\b/gi, "attachment"),
        };
    }

    if (item.type === "task_updated" || item.type === "blocker_noted") {
        return {
            id: item.id,
            type: item.type,
            summary: item.summary,
            occurredAt: item.occurredAt,
        };
    }

    return {
        id: item.id,
        type: "task_updated",
        summary: item.summary,
        occurredAt: item.occurredAt,
    };
}

function buildScopeLabels(aspectIds: AspectKey[] | undefined) {
    const labels = aspectIdsToLabels(aspectIds ?? []);

    if (labels.length === 0) {
        return ["Personal"];
    }

    return labels;
}

function cloneTask(task: TaskDetailReadModel): TaskDetailReadModel {
    return {
        ...task,
        owner: { ...task.owner },
        check: { ...task.check },
        scopeLabels: [...task.scopeLabels],
        scopeIds: [...task.scopeIds],
        resource: task.resource ? { ...task.resource } : undefined,
        documents: task.documents.map((document) => ({ ...document })),
        attachments: task.attachments.map((attachment) => ({ ...attachment })),
        resourceDetail: task.resourceDetail ? { ...task.resourceDetail } : undefined,
        activity: task.activity.map((item) => ({ ...item })),
        blockers: task.blockers.map((blocker) => ({ ...blocker })),
    };
}

function toIndexItem(task: TaskDetailReadModel): TaskIndexItemReadModel {
    return {
        id: task.id,
        title: task.title,
        status: task.status,
        sourceStatus: task.sourceStatus,
        dueAt: task.dueAt,
        owner: { ...task.owner },
        check: { ...task.check },
        scopeLabels: [...task.scopeLabels],
        scopeIds: [...task.scopeIds],
        attachmentCount: task.attachmentCount,
        missingAttachmentCount: task.missingAttachmentCount,
        resource: task.resource ? { ...task.resource } : undefined,
        updatedAt: task.updatedAt,
        isOverdue: task.isOverdue,
        blockerSummary: task.blockerSummary,
    };
}

function hash(value: string) {
    return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function assetCategoryLabel(category: AssetCategory) {
    return `${category[0]!.toUpperCase()}${category.slice(1)}`;
}

export function getStubTasksIndex(query?: TasksIndexQuery): TasksIndexReadModel {
    const store = getStore();
    const items = store.orderedIds
        .map((id) => store.records.get(id)?.detail)
        .filter((detail): detail is TaskDetailReadModel => Boolean(detail))
        .map((detail) => toIndexItem(detail));

    return applyTasksIndexQuery(items, new Date(), query);
}

export function getStubTaskDetail(id: string): TaskDetailReadModel {
    const normalized = getNormalizedTaskSeed(id);
    if (normalized) {
        return cloneTask(buildNormalizedTaskDetail(normalized));
    }

    const store = getStore();
    const record = store.records.get(id);

    if (!record) {
        const fallback = buildTaskDetailReadModel({
            ...getTasksStub(1)[0]!,
            id,
        });
        store.records.set(id, { detail: fallback });
        store.orderedIds.unshift(id);
        return cloneTask(fallback);
    }

    return cloneTask(record.detail);
}

export function resetStubTaskStoreForTests() {
    records = null;
    orderedIds = null;
}

function mapObjectTypeToDocumentKind(
    objectType?: "policy" | "procedure" | "risk" | "assessment",
): TaskDocumentSummaryReadModel["kind"] {
    if (objectType === "policy") {
        return "policy";
    }

    if (objectType === "procedure") {
        return "check_note";
    }

    return "procedure";
}
