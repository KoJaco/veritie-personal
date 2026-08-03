import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { AttachmentDetailReadModel, ObjectsIndexItem } from "@/lib/data-source";
import type { ObjectDetailStub } from "@/lib/stubs";
import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";

export type DocumentsRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

type BuildDocumentsRouteContractParams =
    | {
          scope: "documents_index";
          lens: ScopeLens;
          documents: ObjectsIndexItem[];
      }
    | {
          scope: "documents_detail";
          lens: ScopeLens;
          document: ObjectDetailStub;
          supportingAttachments: AttachmentDetailReadModel[];
      };

export function buildDocumentsIndexPageModel({
    lens,
    documents,
}: {
    lens: ScopeLens;
    documents: ObjectsIndexItem[];
}): PageModel {
    const blockedDocuments = documents.filter(
        (document) => document.coverageStatus === "blocked",
    ).length;
    const atRiskDocuments = documents.filter(
        (document) => document.coverageStatus === "at_risk",
    ).length;
    const unmappedDocuments = documents.filter(
        (document) => document.coverageStatus === "unmapped",
    ).length;

    return {
        meta: {
            title: "Records",
            description: "Personal records and reference material linked to captures.",
            breadcrumbs: [
                { label: "Library" },
                { label: "Records" },
            ],
            aspect: { aspectId: lens.scope },
        },
        view: {
            key: "documents_index",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            visible: documents.slice(0, 12).map((document) => ({
                kind: "document",
                id: document.id,
                title: document.title,
                summary: document.objectType,
                href: `/records/${document.id}`,
            })),
        },
        sections: [
            {
                key: "documents_snapshot",
                title: "Snapshot",
                kind: "metrics_grid",
                items: [
                    {
                        kind: "metric",
                        id: "documents_total",
                        summary: String(documents.length),
                    },
                    {
                        kind: "metric",
                        id: "documents_blocked",
                        summary: String(blockedDocuments),
                    },
                    {
                        kind: "metric",
                        id: "documents_at_risk",
                        summary: String(atRiskDocuments),
                    },
                    {
                        kind: "metric",
                        id: "documents_unmapped",
                        summary: String(unmappedDocuments),
                    },
                ],
            },
            {
                key: "documents_library",
                title: "Records library",
                kind: "documents_table",
                items: documents.slice(0, 12).map((document) => ({
                    kind: "document",
                    id: document.id,
                    summary: document.title,
                })),
            },
        ],
        capabilities: {
            canOpenDocument: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: [
                "documents/open",
                "work/openScopeDialog",
                "context/toggleRail",
            ],
        },
    };
}

export function buildDocumentsDetailPageModel({
    lens,
    document,
    supportingAttachments,
}: {
    lens: ScopeLens;
    document: ObjectDetailStub;
    supportingAttachments: AttachmentDetailReadModel[];
}): PageModel {
    return {
        meta: {
            title: document.title,
            description:
                document.summary ??
                "Record detail and supporting attachments.",
            breadcrumbs: [
                { label: "Library" },
                { label: "Records", href: "/records" },
                { label: document.title },
            ],
            aspect: { aspectId: lens.scope },
        },
        view: {
            key: "documents_detail",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            primary: {
                kind: "document",
                id: document.id,
                title: document.title,
                summary: document.objectType,
                href: `/records/${document.id}`,
            },
            visible: supportingAttachments.slice(0, 12).map((item) => ({
                kind: "attachment",
                id: item.id,
                title: item.title,
                summary: `v${item.currentVersion.versionNumber}`,
                href: `/records/${item.id}`,
            })),
        },
        sections: [
            {
                key: "document_overview",
                title: "Overview",
                kind: "document_overview",
                dataRef: {
                    kind: "document",
                    id: document.id,
                },
            },
            {
                key: "document_content",
                title: "Record content",
                kind: "document_content",
                dataRef: {
                    kind: "document",
                    id: document.id,
                },
            },
            {
                key: "document_attachments",
                title: "Supporting Attachments",
                kind: "attachments_list",
                items: supportingAttachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    summary: item.title,
                })),
            },
        ],
        capabilities: {
            canUploadAttachment: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: [
                "attachments/upload",
                "documents/open",
                "work/openScopeDialog",
                "context/toggleRail",
            ],
        },
    };
}

export function buildDocumentsRouteContract(
    params: BuildDocumentsRouteContractParams,
): DocumentsRouteContract {
    if (params.scope === "documents_index") {
        return {
            pageModel: buildDocumentsIndexPageModel({
                lens: params.lens,
                documents: params.documents,
            }),
            railPayloadCandidate: buildRailPayload({
                scope: { type: "records_index" },
                lens: params.lens,
            }),
        };
    }

    return {
            pageModel: buildDocumentsDetailPageModel({
                lens: params.lens,
                document: params.document,
                supportingAttachments: params.supportingAttachments,
            }),
        railPayloadCandidate: buildRailPayload({
            scope: { type: "records_detail", id: params.document.id },
            primaryObject: { type: "artifact", id: params.document.id },
            lens: params.lens,
        }),
    };
}
