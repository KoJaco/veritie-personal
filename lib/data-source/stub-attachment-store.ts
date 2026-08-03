import {
    getCurrentUser,
    getAttachmentDetailStub,
    getAttachmentsIndexStub,
} from "@/lib/stubs";
import {
    mapAttachmentDetailStubToReadModel,
    mapAttachmentStubToIndexItem,
    type AttachmentArtifactStatus,
    type AttachmentDetailReadModel,
    type AttachmentIndexItemReadModel,
    type AttachmentVersionReadModel,
    type AttachmentVersionStatus,
} from "./attachments-read-model";
import {
    NORMALIZED_ATTACHMENT_IDS,
    getNormalizedAttachmentSeed,
    getNormalizedObjectSeed,
    getNormalizedTaskSeed,
    getStoryUser,
} from "./stub-normalized-stories";
import type {
    UploadAttachmentVersionInput,
    UploadAttachmentVersionResult,
} from "./types";

type StubEvidenceRecord = {
    detail: AttachmentDetailReadModel;
    sortUpdatedAt: string;
};

const INITIAL_EVIDENCE_COUNT = 36;

let records: Map<string, StubEvidenceRecord> | null = null;
let orderedIds: string[] | null = null;

function ensureStore() {
    if (records && orderedIds) {
        return;
    }

    records = new Map();
    orderedIds = [];

    for (const id of NORMALIZED_ATTACHMENT_IDS) {
        const detail = buildNormalizedDetail(id);
        if (!detail) {
            continue;
        }

        records.set(id, {
            detail,
            sortUpdatedAt: detail.updatedAt,
        });
        orderedIds.push(id);
    }

    const seed = getAttachmentsIndexStub(INITIAL_EVIDENCE_COUNT);
    for (const item of seed) {
        if (records.has(item.id)) {
            continue;
        }

        const detail = mapAttachmentDetailStubToReadModel(
            getAttachmentDetailStub(item.id),
        );
        records.set(item.id, {
            detail,
            sortUpdatedAt: detail.updatedAt,
        });
        orderedIds.push(item.id);
    }
}

function getStore() {
    ensureStore();

    return {
        records: records!,
        orderedIds: orderedIds!,
    };
}

function cloneVersion(version: AttachmentVersionReadModel): AttachmentVersionReadModel {
    return { ...version };
}

function cloneDetail(detail: AttachmentDetailReadModel): AttachmentDetailReadModel {
    return {
        ...detail,
        currentVersion: cloneVersion(detail.currentVersion),
        versions: detail.versions.map(cloneVersion),
        attachedTasks: detail.attachedTasks.map((task) => ({ ...task })),
        attachedObjects: detail.attachedObjects.map((object) => ({ ...object })),
        derivedChecks: detail.derivedChecks.map((check) => ({ ...check })),
        derivedScopes: [...detail.derivedScopes],
    };
}

function buildIndexItem(detail: AttachmentDetailReadModel): AttachmentIndexItemReadModel {
    const fallback = mapAttachmentStubToIndexItem({
        id: detail.id,
        filename: detail.currentVersion.fileName ?? `${detail.title}.pdf`,
        fileType: getFileType(detail.currentVersion.fileName),
        attachmentType: detail.kind,
        status: mapArtifactStatusToStubStatus(detail.status),
        linkedTaskId: detail.attachedTasks[0]?.id,
        linkedTaskTitle: detail.attachedTasks[0]?.title,
        linkedObjectId: detail.attachedObjects[0]?.id,
        linkedObjectTitle: detail.attachedObjects[0]?.title,
        uploadedBy: {
            id: detail.currentVersion.uploadedByUserId,
            name: detail.currentVersion.uploadedByName,
            email: `${detail.currentVersion.uploadedByUserId}@example.com`,
            isMe: detail.currentVersion.uploadedByUserId === getCurrentUser().id,
        },
        uploadedAt: detail.currentVersion.uploadedAt,
        validFrom: detail.currentVersion.validFrom,
        validTo: detail.currentVersion.validUntil,
        source: detail.collectionMethod === "manual" ? "manual" : "github",
        tags: detail.derivedScopes,
        updatedAt: detail.updatedAt,
    });

    return {
        ...fallback,
        title: detail.title,
        kind: detail.kind,
        collectionMethod: detail.collectionMethod,
        status: detail.status,
        currentVersionNumber: detail.currentVersion.versionNumber,
        validUntil: detail.currentVersion.validUntil,
        updatedAt: detail.updatedAt,
    };
}

function mapArtifactStatusToStubStatus(status: AttachmentArtifactStatus) {
    if (status === "active") return "accepted" as const;
    if (status === "archived") return "expired" as const;
    if (status === "superseded") return "rejected" as const;
    return "needs_review" as const;
}

function getFileType(fileName?: string) {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    return extension || "bin";
}

function createRecord(id: string): StubEvidenceRecord {
    const normalized = buildNormalizedDetail(id);
    const detail =
        normalized ?? mapAttachmentDetailStubToReadModel(getAttachmentDetailStub(id));
    return {
        detail,
        sortUpdatedAt: detail.updatedAt,
    };
}

function upsertRecord(record: StubEvidenceRecord) {
    const store = getStore();
    if (!store.records.has(record.detail.id)) {
        store.orderedIds.unshift(record.detail.id);
    }
    store.records.set(record.detail.id, record);
}

export function getStubAttachmentDetail(id: string): AttachmentDetailReadModel {
    const store = getStore();
    const existing = store.records.get(id);

    if (existing) {
        return cloneDetail(existing.detail);
    }

    const record = createRecord(id);
    upsertRecord(record);
    return cloneDetail(record.detail);
}

export function getStubAttachmentsIndex(): AttachmentIndexItemReadModel[] {
    const store = getStore();

    return store.orderedIds
        .map((id) => store.records.get(id))
        .filter((record): record is StubEvidenceRecord => Boolean(record))
        .sort(
            (a, b) =>
                new Date(b.sortUpdatedAt).getTime() -
                new Date(a.sortUpdatedAt).getTime(),
        )
        .map((record) => buildIndexItem(record.detail));
}

export function uploadStubAttachmentVersion(
    input: UploadAttachmentVersionInput,
): UploadAttachmentVersionResult {
    const current = getStubAttachmentDetail(input.attachmentId);
    const currentTimestamp = new Date().toISOString();
    const user = getCurrentUser();
    const previousCurrentId = current.currentVersion.id;
    const nextVersionNumber = current.currentVersion.versionNumber + 1;
    const nextVersionId = `${input.attachmentId}-v${nextVersionNumber}`;
    const nextStatus: AttachmentVersionStatus = "approved";
    const newCurrentVersion: AttachmentVersionReadModel = {
        id: nextVersionId,
        versionNumber: nextVersionNumber,
        fileName: input.fileName,
        mimeType: input.mimeType || "application/octet-stream",
        sizeBytes: input.sizeBytes,
        storageKey: `stub/attachments/${input.attachmentId}/${nextVersionId}/${input.fileName}`,
        checksumSha256: undefined,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        status: nextStatus,
        uploadedAt: currentTimestamp,
        uploadedByUserId: user.id,
        uploadedByName: user.name,
    };

    const versions = current.versions.map((version) => {
        if (version.id === previousCurrentId) {
            return {
                ...version,
                status: "superseded" as const,
            };
        }
        return cloneVersion(version);
    });

    const nextDetail: AttachmentDetailReadModel = {
        ...current,
        title: current.title,
        description: input.description ?? current.description,
        kind: input.kind ?? current.kind,
        status: "active",
        updatedAt: currentTimestamp,
        updatedByUserId: user.id,
        currentVersion: newCurrentVersion,
        versions: [newCurrentVersion, ...versions],
    };

    upsertRecord({
        detail: nextDetail,
        sortUpdatedAt: currentTimestamp,
    });

    return {
        attachmentId: input.attachmentId,
        versionId: nextVersionId,
        versionNumber: nextVersionNumber,
    };
}

export function resetStubAttachmentStoreForTests() {
    records = null;
    orderedIds = null;
}

function buildNormalizedDetail(id: string): AttachmentDetailReadModel | null {
    const seed = getNormalizedAttachmentSeed(id);
    if (!seed) {
        return null;
    }

    const owner = getStoryUser(seed.ownerId);
    const versions: AttachmentVersionReadModel[] = seed.versions.map((version) => {
        const uploadedBy = getStoryUser(version.uploadedByUserId);

        return {
            id: version.id,
            versionNumber: version.versionNumber,
            fileName: version.fileName,
            mimeType: version.mimeType,
            sizeBytes: version.sizeBytes,
            storageKey: `stub/attachments/${seed.id}/${version.id}/${version.fileName}`,
            checksumSha256: undefined,
            validFrom: version.validFrom,
            validUntil: version.validUntil,
            status: version.status,
            uploadedAt: version.uploadedAt,
            uploadedByUserId: uploadedBy.id,
            uploadedByName: uploadedBy.name,
        };
    });
    const currentVersion = versions[0];

    if (!currentVersion) {
        return null;
    }

    return {
        id: seed.id,
        accountId: "stub-account",
        title: seed.title,
        description: seed.description,
        kind: seed.kind,
        collectionMethod: seed.collectionMethod,
        status: seed.status,
        ownerUserId: owner.id,
        createdAt: seed.createdAt,
        createdByUserId: owner.id,
        updatedAt: seed.updatedAt,
        updatedByUserId: owner.id,
        currentVersion,
        versions,
        attachedTasks: seed.attachedTaskIds
            .map((taskId) => getNormalizedTaskSeed(taskId))
            .filter((task): task is NonNullable<typeof task> => Boolean(task))
            .map((task) => ({
                id: task.id,
                type: "task" as const,
                title: task.title,
            })),
        attachedObjects: seed.attachedObjectIds
            .map((objectId) => getNormalizedObjectSeed(objectId))
            .filter((object): object is NonNullable<typeof object> => Boolean(object))
            .map((object) => ({
                id: object.id,
                type: "object" as const,
                title: object.title,
            })),
        derivedChecks: seed.attachedObjectIds
            .map((objectId) => getNormalizedObjectSeed(objectId))
            .filter((object): object is NonNullable<typeof object> => Boolean(object))
            .map((object) => ({
                id: object.id,
                title: object.title,
            })),
        derivedScopes: [...seed.derivedScopeIds],
    };
}
