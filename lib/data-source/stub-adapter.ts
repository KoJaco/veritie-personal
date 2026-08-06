import {
    getConnectionsCatalogStub,
    getObjectDetailStub,
    getObjectsIndexStub,
    getSettingsStub,
    getTaskSummariesStub,
    getWorkDashboardStub,
    getWorkTasksStub,
    getScopeCheckSeedById,
    getScopeCheckSeeds,
    getScopeCheckSeedsForScope,
    scopeCheckSeedToObjectDetail,
    scopeCheckSeedToObjectStub,
} from "@/lib/stubs";
import {
    applyResourcesIndexQuery,
    type ResourceIndexQuery,
    type ResourceIndexReadModel,
} from "./resources-read-model";
import {
    buildConnectionsIndexReadModel,
    mapConnectionIndexItem,
    mapConnectionDetail,
    type ConnectionsIndexReadModel,
} from "./connections-read-model";
import {
    checkDetailHref,
    checkScopeFilterKey,
    checkScopeLabel,
    mapCheckDetailStub,
    mapCheckStubToSummary,
    sortChecksByBrokenness,
    summarizeChecks,
    type AggregatedChecksQuery,
    type AggregatedChecksReadModel,
    type CheckScope,
} from "./checks-read-model";
import {
    applyAttachmentIndexFilters,
    summarizeAttachmentsIndex,
    type AttachmentIndexFilters,
    type AttachmentIndexReadModel,
} from "./attachments-read-model";
import { applyObjectsIndexQuery } from "./objects-read-model";
import { getStubObjectsIndex } from "./stub-object-store";
import {
    createStubResource,
    getStubResourceDetail,
    getStubResourcesIndex,
} from "./stub-resource-store";
import {
    getStubAttachmentDetail,
    getStubAttachmentsIndex,
    uploadStubAttachmentVersion,
} from "./stub-attachment-store";
import { getStubTaskDetail, getStubTasksIndex } from "./stub-task-store";
import {
    getCapturesIndex,
    getCaptureDetail,
} from "./captures-read-model";
import {
    getTimelineIndex,
    getTimelineEventDetail,
} from "./timeline-read-model";
import type { DataSourceAdapters, ResourcesReadAdapter } from "./types";
import type { ObjectsIndexQuery, ObjectsIndexReadModel } from "./objects-read-model";
import type { ObjectStub } from "@/lib/stubs";
import type { ResourceStub } from "@/lib/stubs";

const checkDetailCache = new Map<string, ReturnType<typeof getObjectDetailStub>>();

function getStubAttachmentIndexReadModel(): AttachmentIndexReadModel;
function getStubAttachmentIndexReadModel(
    count: number,
    filters?: AttachmentIndexFilters,
): AttachmentIndexReadModel;
function getStubAttachmentIndexReadModel(
    filters?: AttachmentIndexFilters,
): AttachmentIndexReadModel;
function getStubAttachmentIndexReadModel(
    countOrFilters?: number | AttachmentIndexFilters,
    maybeFilters?: AttachmentIndexFilters,
): AttachmentIndexReadModel {
    const count = typeof countOrFilters === "number" ? countOrFilters : undefined;
    const filters =
        typeof countOrFilters === "number" ? maybeFilters : countOrFilters;
    const filteredItems = applyAttachmentIndexFilters(
        getStubAttachmentsIndex(),
        filters,
    );
    const items =
        typeof count === "number" ? filteredItems.slice(0, count) : filteredItems;

    return {
        items,
        summary: summarizeAttachmentsIndex(filteredItems),
    };
}

function getStubObjectsIndexReadModel(): ObjectsIndexReadModel;
function getStubObjectsIndexReadModel(count: number): ObjectStub[];
function getStubObjectsIndexReadModel(query: ObjectsIndexQuery): ObjectsIndexReadModel;
function getStubObjectsIndexReadModel(
    countOrQuery?: number | ObjectsIndexQuery,
): ObjectsIndexReadModel | ObjectStub[] {
    const allItems = getStubObjectsIndex();

    if (typeof countOrQuery === "number") {
        return allItems.slice(0, countOrQuery);
    }

    return applyObjectsIndexQuery(allItems, countOrQuery);
}

function getStubResourcesIndexReadModel(): ResourceIndexReadModel;
function getStubResourcesIndexReadModel(count: number): ResourceStub[];
function getStubResourcesIndexReadModel(
    query: ResourceIndexQuery,
): ResourceIndexReadModel;
function getStubResourcesIndexReadModel(
    countOrQuery?: number | ResourceIndexQuery,
): ResourceIndexReadModel | ResourceStub[] {
    const allItems = getStubResourcesIndex();

    if (typeof countOrQuery === "number") {
        return allItems.slice(0, countOrQuery);
    }

    return applyResourcesIndexQuery(allItems, countOrQuery);
}

function getStubConnectionsIndexReadModel(): ConnectionsIndexReadModel {
    const entries = getConnectionsCatalogStub();
    return buildConnectionsIndexReadModel(entries);
}

export const stubDataSourceAdapters: DataSourceAdapters = {
    dashboard: {
        getTasks: (count, filters) => getWorkTasksStub(count, filters),
        getWorkDashboard: () => getWorkDashboardStub(),
        getTaskSummaries: (tasks, now) => getTaskSummariesStub(tasks, now),
    },
    tasks: {
        getTasksIndex: async (query) => getStubTasksIndex(query),
        getTaskDetail: async (id) => getStubTaskDetail(id),
    },
    attachments: {
        getAttachmentsIndex: getStubAttachmentIndexReadModel,
        getAttachmentDetail: (id) => getStubAttachmentDetail(id),
        uploadAttachmentVersion: (input) => uploadStubAttachmentVersion(input),
    },
    objects: {
        getObjectsIndex: getStubObjectsIndexReadModel,
        getObjectDetail: (id) => getObjectDetailStub(id),
    },
    resources: {
        getResourcesIndex: (async (countOrQuery?: number | ResourceIndexQuery) => {
            if (typeof countOrQuery === "number") {
                return getStubResourcesIndexReadModel(countOrQuery);
            }
            if (countOrQuery !== undefined) {
                return getStubResourcesIndexReadModel(countOrQuery);
            }
            return getStubResourcesIndexReadModel();
        }) as ResourcesReadAdapter["getResourcesIndex"],
        getResourceDetail: async (id) => getStubResourceDetail(id),
        createResource: async (input) => createStubResource(input),
    },
    checks: {
        getAggregatedChecks: (query) => getAggregatedChecksReadModel(query),
        getChecksForScope: (scope, count) => {
            const items = getCheckObjects(scope, count).map((check) =>
                mapCheckStubToSummary(check, scope),
            );

            return {
                items,
                summary: summarizeChecks(items),
            };
        },
        getCheckDetail: (scope, id) => {
            const detail = getCheckObjectDetail(scope, id);
            const mapped = mapCheckDetailStub(detail, scope);

            return {
                ...mapped,
                relatedAttachments: detail.linkedAttachments.map((attachment) => {
                    const attachmentDetail = getStubAttachmentDetail(
                        attachment.id,
                    );

                    return {
                        id: attachmentDetail.id,
                        title: attachmentDetail.title,
                        status: attachmentDetail.status,
                        currentVersionNumber:
                            attachmentDetail.currentVersion.versionNumber,
                        validUntil: attachmentDetail.currentVersion.validUntil,
                    };
                }),
            };
        },
    },
    connections: {
        getConnectionsIndex: () => getStubConnectionsIndexReadModel(),
        getConnectionDetail: (id) => {
            const entry = getConnectionsCatalogStub().find((item) => item.id === id);

            if (!entry) {
                throw new Error(`[connections] missing connection detail for ${id}`);
            }

            const indexItem = mapConnectionIndexItem(entry);

            if (!indexItem.detailHref) {
                throw new Error(
                    `[connections] connection ${id} is not inspectable in this branch`,
                );
            }

            return mapConnectionDetail(entry);
        },
    },
    settings: {
        getSettings: async () => getSettingsStub(),
    },
    timeline: {
        getTimelineIndex: async (query) => getTimelineIndex(query),
        getTimelineEventDetail: async (id) => getTimelineEventDetail(id),
    },
    captures: {
        getCapturesIndex: async (query) => getCapturesIndex(query),
        getCaptureDetail: async (id) => getCaptureDetail(id),
    },
};

function getCheckObjects(scope: CheckScope, count: number) {
    return getScopeCheckSeedsForScope(scope.scopeId, count).map((seed) =>
        scopeCheckSeedToObjectStub(seed),
    );
}

function getAggregatedChecksReadModel(
    query?: AggregatedChecksQuery,
): AggregatedChecksReadModel {
    const appliedQuery: Required<AggregatedChecksQuery> = {
        search: query?.search ?? "",
        scope: query?.scope ?? "all",
        readiness: query?.readiness ?? [],
        ownerState: query?.ownerState ?? [],
    };

    const allItems = getScopeCheckSeeds().map((preset) => {
        const ownerState = preset.ownerName.trim()
            ? ("assigned" as const)
            : ("missing" as const);
        const scope = { scopeId: preset.scopeId };

        return {
            id: preset.id,
            title: preset.title,
            summary: preset.summary,
            domain: preset.domain,
            scopeId: preset.scopeId,
            scopeLabel: checkScopeLabel(scope),
            readiness: preset.coverageStatus,
            linkedAttachmentCount: preset.linkedAttachmentCount,
            linkedTasksCount: preset.linkedTasksCount,
            missingAttachmentCount: preset.missingAttachmentCount,
            updatedAt: preset.updatedAt,
            ownerName: preset.ownerName,
            ownerState,
            detailHref: checkDetailHref(scope, preset.id),
        };
    });

    const filteredItems = allItems.filter((item) => {
        const searchNeedle = appliedQuery.search.trim().toLowerCase();
        const scopeMatches =
            appliedQuery.scope === "all" ||
            checkScopeFilterKey({ scopeId: item.scopeId }) === appliedQuery.scope;
        const searchMatches =
            searchNeedle.length === 0 ||
            item.title.toLowerCase().includes(searchNeedle) ||
            item.summary.toLowerCase().includes(searchNeedle) ||
            item.domain.toLowerCase().includes(searchNeedle);
        const readinessMatches =
            appliedQuery.readiness.length === 0 ||
            appliedQuery.readiness.includes(item.readiness);
        const ownerMatches =
            appliedQuery.ownerState.length === 0 ||
            appliedQuery.ownerState.includes(item.ownerState);

        return (
            searchMatches &&
            scopeMatches &&
            readinessMatches &&
            ownerMatches
        );
    });

    return {
        items: sortChecksByBrokenness(filteredItems),
        summary: summarizeChecks(filteredItems),
        availableScopes: [
            "all",
            "finance",
            "fitness",
            "work",
            "personal",
            "admin",
        ],
        availableReadiness: ["blocked", "unmapped", "at_risk", "complete"],
        availableOwnerStates: ["assigned", "missing"],
        appliedQuery,
    };
}

function getCheckObjectDetail(scope: CheckScope, id: string) {
    const cacheKey = `${scope.scopeId}:${id}`;
    const cached = checkDetailCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const seed = getScopeCheckSeedById(id);
    if (seed && seed.scopeId === scope.scopeId) {
        const resolved = scopeCheckSeedToObjectDetail(seed);
        checkDetailCache.set(cacheKey, resolved);
        return resolved;
    }

    const detail = getObjectDetailStub(id, "procedure");
    if (detail.scopeIds?.includes(scope.scopeId)) {
        checkDetailCache.set(cacheKey, detail);
        return detail;
    }

    throw new Error(
        `[checks] missing check detail for ${scope.scopeId}/${id}`,
    );
}
