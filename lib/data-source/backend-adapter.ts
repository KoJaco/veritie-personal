import type { DataSourceAdapters } from "./types";

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
    tasks: {
        getTasksIndex: () => notImplemented("tasks.getTasksIndex"),
        getTaskDetail: () => notImplemented("tasks.getTaskDetail"),
    },
    attachments: {
        getAttachmentsIndex: () => notImplemented("attachments.getAttachmentsIndex"),
        getAttachmentDetail: () => notImplemented("attachments.getAttachmentDetail"),
        uploadAttachmentVersion: () =>
            notImplemented("attachments.uploadAttachmentVersion"),
    },
    objects: {
        getObjectsIndex: () => notImplemented("objects.getObjectsIndex"),
        getObjectDetail: () => notImplemented("objects.getObjectDetail"),
    },
    resources: {
        getResourcesIndex: () => notImplemented("resources.getResourcesIndex"),
        getResourceDetail: () => notImplemented("resources.getResourceDetail"),
        createResource: () => notImplemented("resources.createResource"),
    },
    checks: {
        getAggregatedChecks: () =>
            notImplemented("checks.getAggregatedChecks"),
        getChecksForScope: () =>
            notImplemented("checks.getChecksForScope"),
        getCheckDetail: () => notImplemented("checks.getCheckDetail"),
    },
    connections: {
        getConnectionsIndex: () => notImplemented("connections.getConnectionsIndex"),
        getConnectionDetail: () => notImplemented("connections.getConnectionDetail"),
    },
    settings: {
        getSettings: () => notImplemented("settings.getSettings"),
    },
    timeline: {
        getTimelineIndex: () => notImplemented("timeline.getTimelineIndex"),
        getTimelineEventDetail: () =>
            notImplemented("timeline.getTimelineEventDetail"),
    },
    captures: {
        getCapturesIndex: () => notImplemented("captures.getCapturesIndex"),
        getCaptureDetail: () => notImplemented("captures.getCaptureDetail"),
    },
};
