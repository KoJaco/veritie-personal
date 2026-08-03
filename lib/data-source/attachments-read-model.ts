import type {
    AttachmentDetailStub,
    AttachmentFilters,
    AttachmentStatus,
    AttachmentStub,
    RelatedObjectStub,
} from "@/lib/stubs";

export type AttachmentKind =
    | "policy"
    | "procedure"
    | "report"
    | "export"
    | "screenshot"
    | "log"
    | "attestation"
    | "other";

export type AttachmentArtifactStatus =
    | "draft"
    | "active"
    | "superseded"
    | "archived";

export type AttachmentVersionStatus =
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "expired"
    | "superseded";

export type AttachmentCollectionMethod = "manual" | "integration" | "generated";

export type AttachmentRelatedEntityType = "task" | "object";

export interface AttachmentRelatedEntity {
    id: string;
    type: AttachmentRelatedEntityType;
    title: string;
}

export interface AttachmentVersionReadModel {
    id: string;
    versionNumber: number;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    storageKey?: string;
    checksumSha256?: string;
    validFrom?: string;
    validUntil?: string;
    status: AttachmentVersionStatus;
    uploadedAt: string;
    uploadedByUserId: string;
    uploadedByName: string;
}

export interface AttachmentIndexItemReadModel {
    id: string;
    title: string;
    kind: AttachmentKind;
    collectionMethod: AttachmentCollectionMethod;
    status: AttachmentArtifactStatus;
    relatedTo?: AttachmentRelatedEntity;
    currentVersionNumber: number;
    validUntil?: string;
    updatedAt: string;
}

export interface AttachmentIndexSummaryReadModel {
    totalAttachments: number;
    activeAttachments: number;
    expiringSoon: number;
    needsReview: number;
}

export interface AttachmentIndexReadModel {
    items: AttachmentIndexItemReadModel[];
    summary: AttachmentIndexSummaryReadModel;
}

export interface AttachmentDetailReadModel {
    id: string;
    accountId: string;
    title: string;
    description?: string;
    kind: AttachmentKind;
    collectionMethod: AttachmentCollectionMethod;
    status: AttachmentArtifactStatus;
    ownerUserId?: string;
    createdAt: string;
    createdByUserId: string;
    updatedAt: string;
    updatedByUserId: string;
    currentVersion: AttachmentVersionReadModel;
    versions: AttachmentVersionReadModel[];
    attachedTasks: AttachmentRelatedEntity[];
    attachedObjects: AttachmentRelatedEntity[];
    derivedChecks: Array<{ id: string; title: string }>;
    derivedScopes: string[];
}

export interface AttachmentIndexFilters {
    search?: string;
    kind?: AttachmentKind[];
    status?: AttachmentArtifactStatus[];
    attachedTo?: "task" | "object" | "none";
    expiry?: "valid" | "expiring" | "expired";
}

export function mapAttachmentIndexFiltersToStub(
    filters?: AttachmentIndexFilters,
): AttachmentFilters | undefined {
    if (!filters) return undefined;

    const mappedStatus = mapArtifactStatusesToStub(filters.status);

    let linked: AttachmentFilters["linked"];
    if (filters.attachedTo === "none") linked = "unlinked";
    if (filters.attachedTo === "task" || filters.attachedTo === "object") {
        linked = "linked";
    }

    const dateRange = filters.expiry === "expiring" ? "30" : undefined;

    return {
        status: mappedStatus,
        linked,
        dateRange,
    };
}

export function applyAttachmentIndexFilters(
    items: AttachmentIndexItemReadModel[],
    filters?: AttachmentIndexFilters,
): AttachmentIndexItemReadModel[] {
    if (!filters) return items;

    const today = new Date();
    const expiringThreshold = new Date(today);
    expiringThreshold.setDate(expiringThreshold.getDate() + 30);

    const searchTerm = filters.search?.trim().toLowerCase();

    return items.filter((item) => {
        if (searchTerm && !item.title.toLowerCase().includes(searchTerm)) {
            return false;
        }

        if (filters.kind && filters.kind.length > 0) {
            if (!filters.kind.includes(item.kind)) {
                return false;
            }
        }

        if (filters.status && filters.status.length > 0) {
            if (!filters.status.includes(item.status)) {
                return false;
            }
        }

        if (filters.attachedTo === "none" && item.relatedTo) {
            return false;
        }
        if (
            (filters.attachedTo === "task" || filters.attachedTo === "object") &&
            item.relatedTo?.type !== filters.attachedTo
        ) {
            return false;
        }

        if (filters.expiry) {
            const validUntilMs = item.validUntil
                ? new Date(item.validUntil).getTime()
                : null;
            const isDateValid = validUntilMs !== null && !Number.isNaN(validUntilMs);

            if (filters.expiry === "expired") {
                return Boolean(isDateValid && validUntilMs! < today.getTime());
            }

            if (filters.expiry === "expiring") {
                return Boolean(
                    isDateValid &&
                        validUntilMs! >= today.getTime() &&
                        validUntilMs! <= expiringThreshold.getTime(),
                );
            }

            if (filters.expiry === "valid") {
                if (!isDateValid) return true;
                return validUntilMs! > expiringThreshold.getTime();
            }
        }

        return true;
    });
}

function mapArtifactStatusesToStub(
    statuses?: AttachmentArtifactStatus[],
): AttachmentStatus[] | undefined {
    if (!statuses || statuses.length === 0) return undefined;

    const mapped = new Set<AttachmentStatus>();

    for (const status of statuses) {
        if (status === "draft") {
            mapped.add("requested");
            mapped.add("needs_review");
            mapped.add("rejected");
            continue;
        }

        if (status === "active") {
            mapped.add("uploaded");
            mapped.add("accepted");
            continue;
        }

        if (status === "superseded") {
            mapped.add("accepted");
            continue;
        }

        if (status === "archived") {
            mapped.add("expired");
        }
    }

    return mapped.size > 0 ? Array.from(mapped) : undefined;
}

export function mapAttachmentStubToIndexItem(
    attachment: AttachmentStub,
): AttachmentIndexItemReadModel {
    return {
        id: attachment.id,
        title: normalizeAttachmentTitle(attachment.filename),
        kind: mapStubKind(attachment.attachmentType, attachment.fileType),
        collectionMethod: mapStubCollectionMethod(attachment.source),
        status: mapStubStatusToArtifactStatus(attachment.status),
        relatedTo: mapAttachmentRelatedEntity(attachment),
        currentVersionNumber: 1,
        validUntil: attachment.validTo,
        updatedAt: attachment.updatedAt,
    };
}

export function mapAttachmentDetailStubToReadModel(
    detail: AttachmentDetailStub,
): AttachmentDetailReadModel {
    const createdByUserId = detail.uploadedBy.id;
    const createdAt = detail.uploadedAt;
    const currentVersion = buildCurrentVersion(detail);

    return {
        id: detail.id,
        accountId: "stub-account",
        title: normalizeAttachmentTitle(detail.filename),
        description: detail.summary,
        kind: mapStubKind(detail.attachmentType, detail.fileType),
        collectionMethod: mapStubCollectionMethod(detail.source),
        status: mapStubStatusToArtifactStatus(detail.status),
        ownerUserId: detail.uploadedBy.id,
        createdAt,
        createdByUserId,
        updatedAt: detail.updatedAt,
        updatedByUserId: detail.uploadedBy.id,
        currentVersion,
        versions: buildVersionHistory(detail, currentVersion),
        attachedTasks: detail.linkedTaskId
            ? [
                  {
                      id: detail.linkedTaskId,
                      type: "task",
                      title: detail.linkedTaskTitle ?? "Related task",
                  },
              ]
            : [],
        attachedObjects: detail.linkedObjectId
            ? [
                  {
                      id: detail.linkedObjectId,
                      type: "object",
                      title: detail.linkedObjectTitle ?? "Related object",
                  },
              ]
            : [],
        derivedChecks: (detail.linkedChecks ?? []).map((check) => ({
            id: check.id,
            title: check.title,
        })),
        derivedScopes: [],
    };
}

export function summarizeAttachmentsIndex(
    items: AttachmentIndexItemReadModel[],
): AttachmentIndexSummaryReadModel {
    const now = new Date();
    const soonThreshold = new Date(now);
    soonThreshold.setDate(soonThreshold.getDate() + 30);

    const activeAttachments = items.filter(
        (item) => item.status === "active",
    ).length;
    const needsReview = items.filter((item) => item.status === "draft").length;
    const expiringSoon = items.filter((item) => {
        if (!item.validUntil) return false;
        const expiryDate = new Date(item.validUntil);
        if (Number.isNaN(expiryDate.getTime())) return false;
        return expiryDate >= now && expiryDate <= soonThreshold;
    }).length;

    return {
        totalAttachments: items.length,
        activeAttachments,
        expiringSoon,
        needsReview,
    };
}

function mapAttachmentRelatedEntity(
    attachment: Pick<
        AttachmentStub,
        | "linkedTaskId"
        | "linkedTaskTitle"
        | "linkedObjectId"
        | "linkedObjectTitle"
    >,
): AttachmentRelatedEntity | undefined {
    if (attachment.linkedTaskId) {
        return {
            id: attachment.linkedTaskId,
            type: "task",
            title: attachment.linkedTaskTitle ?? "Related task",
        };
    }

    if (attachment.linkedObjectId) {
        return {
            id: attachment.linkedObjectId,
            type: "object",
            title: attachment.linkedObjectTitle ?? "Related object",
        };
    }

    return undefined;
}

function buildCurrentVersion(
    detail: AttachmentDetailStub,
): AttachmentVersionReadModel {
    return {
        id: `${detail.id}-v1`,
        versionNumber: 1,
        fileName: detail.filename,
        mimeType: inferMimeType(detail.filename, detail.fileType),
        sizeBytes: detail.sizeBytes,
        storageKey: `stub/attachments/${detail.id}/${detail.filename}`,
        checksumSha256: undefined,
        validFrom: detail.validFrom,
        validUntil: detail.validTo,
        status: mapStubStatusToVersionStatus(detail.status),
        uploadedAt: detail.uploadedAt,
        uploadedByUserId: detail.uploadedBy.id,
        uploadedByName: detail.uploadedBy.name,
    };
}

function buildVersionHistory(
    detail: AttachmentDetailStub,
    currentVersion: AttachmentVersionReadModel,
): AttachmentVersionReadModel[] {
    const base = new Date(detail.uploadedAt);
    const previousDate = Number.isNaN(base.getTime())
        ? new Date()
        : new Date(base);
    previousDate.setDate(previousDate.getDate() - 14);

    const olderDate = new Date(previousDate);
    olderDate.setDate(olderDate.getDate() - 21);

    return [
        currentVersion,
        {
            ...currentVersion,
            id: `${detail.id}-v0`,
            versionNumber: 0,
            status: "superseded",
            uploadedAt: previousDate.toISOString(),
        },
        {
            ...currentVersion,
            id: `${detail.id}-v-1`,
            versionNumber: -1,
            status: "superseded",
            uploadedAt: olderDate.toISOString(),
        },
    ];
}
function normalizeAttachmentTitle(fileName: string): string {
    return fileName.replace(/[_-]+/g, " ").replace(/\.[a-z0-9]+$/i, "");
}

function mapStubKind(
    attachmentType: string | undefined,
    fileType: string,
): AttachmentKind {
    if (attachmentType === "policy") return "policy";
    if (attachmentType === "report") return "report";
    if (
        attachmentType === "export" ||
        fileType === "csv" ||
        fileType === "xlsx"
    ) {
        return "export";
    }
    if (attachmentType === "screenshot" || fileType === "png")
        return "screenshot";
    return "other";
}

function mapStubCollectionMethod(
    source: AttachmentStub["source"],
): AttachmentCollectionMethod {
    if (source === "manual") return "manual";
    return "integration";
}

function mapStubStatusToArtifactStatus(
    status: AttachmentStatus,
): AttachmentArtifactStatus {
    if (status === "uploaded" || status === "accepted") return "active";
    if (status === "expired") return "archived";
    return "draft";
}

function mapStubStatusToVersionStatus(
    status: AttachmentStatus,
): AttachmentVersionStatus {
    if (status === "requested") return "draft";
    if (status === "needs_review") return "submitted";
    if (status === "uploaded" || status === "accepted") return "approved";
    if (status === "rejected") return "rejected";
    if (status === "expired") return "expired";
    return "draft";
}

function inferMimeType(fileName: string, fileType: string): string {
    if (fileType === "pdf") return "application/pdf";
    if (fileType === "png") return "image/png";
    if (fileType === "xlsx") {
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    if (fileType === "csv") return "text/csv";
    if (fileType === "docx") {
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "application/pdf";
    if (extension === "png") return "image/png";
    return "application/octet-stream";
}

export function mapRelatedControls(
    linkedChecks: RelatedObjectStub[] | undefined,
): Array<{ id: string; title: string }> {
    return (linkedChecks ?? []).map((check) => ({
        id: check.id,
        title: check.title,
    }));
}
