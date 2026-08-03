import {
    getCurrentUser,
    getSeedResourceRecords,
    getTaskDetailStub,
    type ResourceConnectionLinkStub,
    type ResourceControlLinkStub,
    type ResourceCoverageFlags,
    type ResourceCriticality,
    type ResourceDetailStub,
    type ResourceSensitivity,
    type ResourceStub,
} from "@/lib/stubs";
import type { ResourceCategory, AssigneeStub } from "@/lib/stubs";
import {
    getNormalizedAttachmentSummaryStub,
    getNormalizedTaskStub,
} from "./stub-normalized-stories";
import type { CreateResourceInput, CreateResourceResult } from "./resources-read-model";

type ResourceRecord = {
    detail: ResourceDetailStub;
};

let records: Map<string, ResourceRecord> | null = null;
let orderedIds: string[] | null = null;

function ensureStore() {
    if (records && orderedIds) {
        return;
    }

    records = new Map();
    orderedIds = [];

    for (const seed of getSeedResourceRecords()) {
        const detail: ResourceDetailStub = {
            ...{
                id: seed.id,
                name: seed.name,
                category: seed.category,
                summary: seed.summary,
                owner: seed.owner ? { ...seed.owner } : null,
                criticality: seed.criticality,
                sensitivity: seed.sensitivity,
                scopeIds: [...seed.scopeIds],
                coverageFlags: { ...seed.coverageFlags },
                linkedChecksCount: seed.linkedChecks.length,
                linkedTasksCount: seed.linkedTaskIds.length,
                linkedAttachmentCount: seed.linkedAttachments.length,
                linkedConnectionsCount: seed.linkedConnections.length,
                updatedAt: seed.updatedAt,
            },
            postureSummary: seed.postureSummary,
            linkedChecks: seed.linkedChecks.map(cloneControlLink),
            linkedTasks: seed.linkedTaskIds.map(
                (taskId) => getNormalizedTaskStub(taskId) ?? getTaskDetailStub(taskId),
            ),
            linkedAttachments: seed.linkedAttachments.map((item) => {
                const normalized = getNormalizedAttachmentSummaryStub(item.id);

                return (
                    normalized ?? {
                        id: item.id,
                        filename: item.filename,
                        status: "accepted" as const,
                    }
                );
            }),
            linkedConnections: seed.linkedConnections.map(cloneConnectionLink),
            timeline: [
                {
                    id: `${seed.id}-created`,
                    type: "created",
                    occurredAt: seed.updatedAt,
                    actor: seed.owner ? { ...seed.owner } : getCurrentUser(),
                    summary: `Created ${seed.category} resource record.`,
                },
            ],
        };

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

function cloneAssignee(assignee: AssigneeStub | null): AssigneeStub | null {
    return assignee ? { ...assignee } : null;
}

function cloneCoverageFlags(flags: ResourceCoverageFlags): ResourceCoverageFlags {
    return { ...flags };
}

function cloneControlLink(link: ResourceControlLinkStub): ResourceControlLinkStub {
    return { ...link };
}

function cloneConnectionLink(
    link: ResourceConnectionLinkStub,
): ResourceConnectionLinkStub {
    return { ...link };
}

function cloneResourceStub(resource: ResourceStub): ResourceStub {
    return {
        ...resource,
        owner: cloneAssignee(resource.owner),
        scopeIds: [...resource.scopeIds],
        coverageFlags: cloneCoverageFlags(resource.coverageFlags),
    };
}

function cloneResourceDetail(detail: ResourceDetailStub): ResourceDetailStub {
    return {
        ...cloneResourceStub(detail),
        postureSummary: detail.postureSummary,
        linkedChecks: detail.linkedChecks.map(cloneControlLink),
        linkedTasks: detail.linkedTasks.map((task) => ({ ...task })),
        linkedAttachments: detail.linkedAttachments.map((attachment) => ({
            ...attachment,
        })),
        linkedConnections: detail.linkedConnections.map(cloneConnectionLink),
        timeline: detail.timeline.map((event) => ({
            ...event,
            actor: { ...event.actor },
        })),
    };
}

export function getStubResourcesIndex(): ResourceStub[] {
    const store = getStore();

    return store.orderedIds
        .map((id) => store.records.get(id)?.detail)
        .filter((detail): detail is ResourceDetailStub => Boolean(detail))
        .sort(
            (left, right) =>
                new Date(right.updatedAt).getTime() -
                new Date(left.updatedAt).getTime(),
        )
        .map(cloneResourceStub);
}

export function getStubResourceDetail(id: string): ResourceDetailStub {
    const store = getStore();
    const record = store.records.get(id);

    if (!record) {
        throw new Error(`[data-source] unknown stub resource id: ${id}`);
    }

    return cloneResourceDetail(record.detail);
}

function toOwner(input: CreateResourceInput): AssigneeStub | null {
    if (!input.ownerName.trim()) {
        return null;
    }

    return {
        id: input.ownerId ?? getCurrentUser().id,
        name: input.ownerName.trim(),
        email: input.ownerId
            ? `${input.ownerId}@example.com`
            : getCurrentUser().email,
        isMe: !input.ownerId || input.ownerId === getCurrentUser().id,
    };
}

function createTimelineSummary(category: ResourceCategory) {
    return `Created ${category} resource via manual add.`;
}

export function createStubResource(input: CreateResourceInput): CreateResourceResult {
    const store = getStore();
    const now = new Date().toISOString();
    const resourceId = `resource_${Date.now()}`;
    const owner = toOwner(input);
    const linkedChecks: ResourceControlLinkStub[] = [];
    const linkedConnections: ResourceConnectionLinkStub[] = [];
    const linkedAttachments: ResourceDetailStub["linkedAttachments"] = [];

    const detail: ResourceDetailStub = {
        id: resourceId,
        name: input.name,
        category: input.category,
        summary:
            input.description?.trim() ||
            `${input.name} posture record for operations ownership and attachment tracking.`,
        owner,
        criticality: input.criticality as ResourceCriticality,
        sensitivity: input.sensitivity as ResourceSensitivity,
        scopeIds: [],
        coverageFlags: {
            hasOwner: Boolean(owner),
            hasAttachments: false,
            mappedToChecks: false,
            monitored: false,
        },
        linkedChecksCount: linkedChecks.length,
        linkedTasksCount: 0,
        linkedAttachmentCount: linkedAttachments.length,
        linkedConnectionsCount: linkedConnections.length,
        updatedAt: now,
        postureSummary:
            "Manual resource entry created to track ownership and posture over time.",
        linkedChecks,
        linkedTasks: [],
        linkedAttachments,
        linkedConnections,
        timeline: [
            {
                id: `${resourceId}-created`,
                type: "created",
                occurredAt: now,
                actor: getCurrentUser(),
                summary: createTimelineSummary(input.category),
            },
        ],
    };

    store.records.set(resourceId, { detail });
    store.orderedIds.unshift(resourceId);

    return { resourceId };
}

export function resetStubResourceStoreForTests() {
    records = null;
    orderedIds = null;
}
