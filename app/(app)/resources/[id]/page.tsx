import { notFound } from "next/navigation";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { AttachmentUploadFlow } from "@/components/attachments/AttachmentUploadFlow";
import { getDataSourceAdapters } from "@/lib/data-source";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { logger } from "@/lib/logging/server-logger";
import {
    ResourceSummarySection,
    ResourceTimelineSection,
    ConnectionLinksSection,
    LinkedControlsSection,
    LinkedAttachmentsSection,
    LinkedTasksSection,
} from "../_components/ResourceDetailSections";
import { buildResourcesRouteContract } from "../_page-model/build";
import { enforceResourcesRouteContract } from "../_page-model/validate";

interface ResourceDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<SearchParamRecord>;
}

export default async function ResourceDetailPage({
    params,
    searchParams,
}: ResourceDetailPageProps) {
    const { id } = await params;
    const lens = getLensFromSearchParams(await searchParams);
    const dataSource = getDataSourceAdapters();

    let resource;
    try {
        resource = await dataSource.resources.getResourceDetail(id);
    } catch {
        notFound();
    }

    const contract = buildResourcesRouteContract({
        scope: "resources_detail",
        lens,
        resource,
    });
    const { pageModelValidation, payload } = enforceResourcesRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/resources/[id]",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/resources/[id]",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/resources/[id]",
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
                        title="Resource detail"
                        separator={false}
                        actions={
                            <AttachmentUploadFlow
                                context={{
                                    kind: "resource",
                                    resourceId: id,
                                    resourceTitle: resource.name,
                                }}
                                triggerLabel="Upload attachment"
                                triggerVariant="outline"
                            />
                        }
                    />
                }
            >
                <div className="space-y-12 py-4">
                    <ResourceSummarySection resource={resource} />

                    <LinkedControlsSection resource={resource} />
                    <LinkedTasksSection resource={resource} />

                    <LinkedAttachmentsSection resource={resource} />
                    <ConnectionLinksSection resource={resource} />
                    <ResourceTimelineSection resource={resource} />
                </div>
            </PageFrame>
        </>
    );
}
