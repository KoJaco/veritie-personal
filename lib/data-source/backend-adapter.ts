import type { DataSourceAdapters } from "./types";
import { backendCapturesAdapter } from "./backend/captures-adapter";
import { backendResourcesAdapter } from "./backend/resources-adapter";
import { backendSettingsAdapter } from "./backend/settings-adapter";
import { backendTasksAdapter } from "./backend/tasks-adapter";
import { backendTimelineAdapter } from "./backend/timeline-adapter";

function notImplemented(method: string): never {
    throw new Error(
        `[data-source] backend adapter not implemented for method: ${method}`,
    );
}

export const backendDataSourceAdapters: DataSourceAdapters = {
    dashboard: {
        getTasks: () => notImplemented("dashboard.getTasks"),
        getWorkDashboard: () => notImplemented("dashboard.getWorkDashboard"),
        getTaskSummaries: () => notImplemented("dashboard.getTaskSummaries"),
    },
    tasks: backendTasksAdapter,
    attachments: {
        getAttachmentsIndex: () =>
            notImplemented("attachments.getAttachmentsIndex"),
        getAttachmentDetail: () =>
            notImplemented("attachments.getAttachmentDetail"),
        uploadAttachmentVersion: () =>
            notImplemented("attachments.uploadAttachmentVersion"),
    },
    objects: {
        getObjectsIndex: () => notImplemented("objects.getObjectsIndex"),
        getObjectDetail: () => notImplemented("objects.getObjectDetail"),
    },
    resources: backendResourcesAdapter,
    checks: {
        getAggregatedChecks: () =>
            notImplemented("checks.getAggregatedChecks"),
        getChecksForScope: () =>
            notImplemented("checks.getChecksForScope"),
        getCheckDetail: () => notImplemented("checks.getCheckDetail"),
    },
    connections: {
        getConnectionsIndex: () =>
            notImplemented("connections.getConnectionsIndex"),
        getConnectionDetail: () =>
            notImplemented("connections.getConnectionDetail"),
    },
    settings: backendSettingsAdapter,
    timeline: backendTimelineAdapter,
    captures: backendCapturesAdapter,
};
