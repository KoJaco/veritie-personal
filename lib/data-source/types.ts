import type {
    ObjectDetailStub,
    ObjectStub,
    SettingsStub,
    TaskFilters,
    TaskStub,
    TaskSummaryStub,
    WorkDashboardStub,
    ResourceDetailStub,
    ResourceStub,
} from "@/lib/stubs";
import type {
    AttachmentKind,
    AttachmentDetailReadModel,
    AttachmentIndexFilters,
    AttachmentIndexReadModel,
} from "./attachments-read-model";
import type {
    AggregatedChecksQuery,
    AggregatedChecksReadModel,
    CheckDetailReadModel,
    CheckIndexReadModel,
    CheckScope,
} from "./checks-read-model";
import type {
    ConnectionDetailReadModel,
    ConnectionsIndexReadModel,
} from "./connections-read-model";
import type {
    CreateResourceInput,
    CreateResourceResult,
    ResourceIndexQuery,
    ResourceIndexReadModel,
} from "./resources-read-model";
import type {
    TaskDetailReadModel,
    TasksIndexQuery,
    TasksIndexReadModel,
} from "./tasks-read-model";
import type {
    ObjectsIndexQuery,
    ObjectsIndexReadModel,
} from "./objects-read-model";

export type DataSourceKind = "stub" | "backend";

export interface DashboardReadAdapter {
    getTasks(count: number, filters?: TaskFilters): TaskStub[];
    getWorkDashboard(): WorkDashboardStub;
    getTaskSummaries(tasks: TaskStub[], now: Date): TaskSummaryStub[];
}

export interface TasksReadAdapter {
    getTasksIndex(query?: TasksIndexQuery): TasksIndexReadModel;
    getTaskDetail(id: string): TaskDetailReadModel;
}

export interface AttachmentsReadAdapter {
    getAttachmentsIndex(): AttachmentIndexReadModel;
    getAttachmentsIndex(
        count: number,
        filters?: AttachmentIndexFilters,
    ): AttachmentIndexReadModel;
    getAttachmentsIndex(filters?: AttachmentIndexFilters): AttachmentIndexReadModel;
    getAttachmentDetail(id: string): AttachmentDetailReadModel;
    uploadAttachmentVersion(
        input: UploadAttachmentVersionInput,
    ): UploadAttachmentVersionResult;
}

export interface UploadAttachmentVersionInput {
    attachmentId: string;
    title?: string;
    description?: string;
    kind?: AttachmentKind;
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    validFrom?: string;
    validUntil?: string;
}

export interface UploadAttachmentVersionResult {
    attachmentId: string;
    versionId: string;
    versionNumber: number;
}

export interface ObjectsReadAdapter {
    getObjectsIndex(): ObjectsIndexReadModel;
    getObjectsIndex(count: number): ObjectStub[];
    getObjectsIndex(query: ObjectsIndexQuery): ObjectsIndexReadModel;
    getObjectDetail(id: string): ObjectDetailStub;
}

export interface ResourcesReadAdapter {
    getResourcesIndex(): ResourceIndexReadModel;
    getResourcesIndex(query: ResourceIndexQuery): ResourceIndexReadModel;
    getResourcesIndex(count: number): ResourceStub[];
    getResourceDetail(id: string): ResourceDetailStub;
    createResource(input: CreateResourceInput): CreateResourceResult;
}

export interface ChecksReadAdapter {
    getAggregatedChecks(
        query?: AggregatedChecksQuery,
    ): AggregatedChecksReadModel;
    getChecksForScope(
        scope: CheckScope,
        count: number,
    ): CheckIndexReadModel;
    getCheckDetail(
        scope: CheckScope,
        id: string,
    ): CheckDetailReadModel;
}

export interface ConnectionsReadAdapter {
    getConnectionsIndex(): ConnectionsIndexReadModel;
    getConnectionDetail(id: string): ConnectionDetailReadModel;
}

export interface SettingsReadAdapter {
    getSettings(): SettingsStub;
}

export interface TimelineReadAdapter {
    getTimelineIndex(query?: import("./timeline-read-model").TimelineIndexQuery): import("./timeline-read-model").TimelineIndexReadModel;
    getTimelineEventDetail(id: string): import("./timeline-read-model").TimelineEventDetailReadModel | null;
}

export interface CapturesReadAdapter {
    getCapturesIndex(query?: import("./captures-read-model").CapturesIndexQuery): import("./captures-read-model").CapturesIndexReadModel;
    getCaptureDetail(id: string): import("./captures-read-model").CaptureDetailReadModel | null;
}

export interface DataSourceAdapters {
    dashboard: DashboardReadAdapter;
    tasks: TasksReadAdapter;
    attachments: AttachmentsReadAdapter;
    objects: ObjectsReadAdapter;
    resources: ResourcesReadAdapter;
    checks: ChecksReadAdapter;
    connections: ConnectionsReadAdapter;
    settings: SettingsReadAdapter;
    timeline: TimelineReadAdapter;
    captures: CapturesReadAdapter;
}

export type ResourceIndexItem = ResourceStub;
