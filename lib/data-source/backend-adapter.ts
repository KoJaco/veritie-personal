import type { DataSourceAdapters } from "./types";
import type { ObjectsIndexQuery, ObjectsIndexReadModel } from "./objects-read-model";
import { applyObjectsIndexQuery } from "./objects-read-model";
import type { ObjectStub } from "@/lib/stubs";
import { backendCapturesAdapter } from "./backend/captures-adapter";
import {
    deferredUploadAttachmentVersion,
    emptyAggregatedChecksReadModel,
    emptyAttachmentDetailReadModel,
    emptyAttachmentsIndexReadModel,
    emptyCheckDetailReadModel,
    emptyChecksForScopeReadModel,
    emptyConnectionDetailReadModel,
    emptyConnectionsIndexReadModel,
    emptyDashboardTasks,
    emptyObjectDetailStub,
    emptyObjectsIndexReadModel,
    emptyTaskSummaries,
    emptyWorkDashboardStub,
} from "./backend/deferred-adapters";
import { backendResourcesAdapter } from "./backend/resources-adapter";
import { backendSettingsAdapter } from "./backend/settings-adapter";
import { backendTasksAdapter } from "./backend/tasks-adapter";
import { backendTimelineAdapter } from "./backend/timeline-adapter";

function getDeferredObjectsIndex(): ObjectsIndexReadModel;
function getDeferredObjectsIndex(count: number): ObjectStub[];
function getDeferredObjectsIndex(query: ObjectsIndexQuery): ObjectsIndexReadModel;
function getDeferredObjectsIndex(
    countOrQuery?: number | ObjectsIndexQuery,
): ObjectsIndexReadModel | ObjectStub[] {
    if (typeof countOrQuery === "number") {
        return [];
    }
    if (countOrQuery) {
        return applyObjectsIndexQuery([], countOrQuery);
    }
    return emptyObjectsIndexReadModel();
}

export const backendDataSourceAdapters: DataSourceAdapters = {
    dashboard: {
        getTasks: () => emptyDashboardTasks(),
        getWorkDashboard: () => emptyWorkDashboardStub(),
        getTaskSummaries: () => emptyTaskSummaries(),
    },
    tasks: backendTasksAdapter,
    attachments: {
        getAttachmentsIndex: () => emptyAttachmentsIndexReadModel(),
        getAttachmentDetail: (id) => emptyAttachmentDetailReadModel(id),
        uploadAttachmentVersion: deferredUploadAttachmentVersion,
    },
    objects: {
        getObjectsIndex: getDeferredObjectsIndex,
        getObjectDetail: (id) => emptyObjectDetailStub(id),
    },
    resources: backendResourcesAdapter,
    checks: {
        getAggregatedChecks: () => emptyAggregatedChecksReadModel(),
        getChecksForScope: (_scope, _count) => emptyChecksForScopeReadModel(),
        getCheckDetail: (scope, id) => emptyCheckDetailReadModel(scope, id),
    },
    connections: {
        getConnectionsIndex: () => emptyConnectionsIndexReadModel(),
        getConnectionDetail: (id) => emptyConnectionDetailReadModel(id),
    },
    settings: backendSettingsAdapter,
    timeline: backendTimelineAdapter,
    captures: backendCapturesAdapter,
};
