import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Button } from "@/components/ui/button";
import { AttachmentUploadFlow } from "@/components/attachments/AttachmentUploadFlow";
import {
    getLensFromSearchParams,
    type SearchParamRecord,
} from "@/lib/lens";
import {
    getDataSourceAdapters,
    getObjectAttachmentSummaries,
} from "@/lib/data-source";
import { logger } from "@/lib/logging/server-logger";
import { DocumentDetailContent } from "../_components/DocumentDetailContent";
import { buildDocumentsRouteContract } from "../_page-model/build";
import { enforceDocumentsRouteContract } from "../_page-model/validate";

interface DocumentDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<SearchParamRecord>;
}

export default async function DocumentDetailPage({
    params,
    searchParams,
}: DocumentDetailPageProps) {
    const dataSource = getDataSourceAdapters();
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const lens = getLensFromSearchParams(resolvedSearchParams);
    const document = dataSource.objects.getObjectDetail(id);
    const supportingAttachments = getObjectAttachmentSummaries(document).map(
        (attachmentSummary) =>
            dataSource.attachments.getAttachmentDetail(attachmentSummary.id),
    );
    const markdownContent =
        document.markdownContent ??
        "# Document detail\n\nNo markdown content available for this document yet.";
    const contract = buildDocumentsRouteContract({
        scope: "documents_detail",
        lens,
        document,
        supportingAttachments,
    });
    const { pageModelValidation, payload } =
        enforceDocumentsRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/work/documents/[id]",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/work/documents/[id]",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/work/documents/[id]",
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes,
        });
    }

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={
                    <PageHeader
                        title={document.title}
                        description="Document detail and supporting attachments."
                        separator={false}
                        actions={
                            <>
                                <Button variant="outline" size="sm" disabled>
                                    Attach existing attachment
                                </Button>
                                <AttachmentUploadFlow
                                    context={{
                                        kind: "object",
                                        objectId: id,
                                        objectTitle: document.title,
                                    }}
                                    triggerLabel="Upload attachment"
                                    triggerVariant="outline"
                                />
                            </>
                        }
                    />
                }
            >
                <DocumentDetailContent
                    document={document}
                    markdownContent={markdownContent}
                    supportingAttachments={supportingAttachments}
                    searchParams={resolvedSearchParams}
                />
            </PageFrame>
        </>
    );
}
