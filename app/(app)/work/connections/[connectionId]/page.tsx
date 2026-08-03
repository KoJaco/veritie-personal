import { notFound } from "next/navigation";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { getDataSourceAdapters } from "@/lib/data-source";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { logger } from "@/lib/logging/server-logger";
import {
    ConnectionDetailContent,
    ConnectionDetailHeaderActions,
} from "../_components/ConnectionDetailContent";
import { buildConnectionsRouteContract } from "../_page-model/build";
import { enforceConnectionsRouteContract } from "../_page-model/validate";

interface ConnectionDetailPageProps {
    params: Promise<{ connectionId: string }>;
    searchParams: Promise<SearchParamRecord>;
}

export default async function ConnectionDetailPage({
    params,
    searchParams,
}: ConnectionDetailPageProps) {
    const { connectionId } = await params;
    const lens = getLensFromSearchParams(await searchParams);
    const dataSource = getDataSourceAdapters();

    let detail;
    try {
        detail = dataSource.connections.getConnectionDetail(connectionId);
    } catch {
        notFound();
        return null;
    }

    const provider = dataSource.connections
        .getConnectionsIndex()
        .providerOptions.find((item) => item.key === detail.key);

    if (!provider) {
        notFound();
        return null;
    }

    const contract = buildConnectionsRouteContract({
        scope: "connections_detail",
        lens,
        connectionDetail: detail,
    });
    const { pageModelValidation, payload } =
        enforceConnectionsRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/work/connections/[connectionId]",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/work/connections/[connectionId]",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/work/connections/[connectionId]",
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
                        title={detail.label}
                        separator={false}
                        actions={
                            <ConnectionDetailHeaderActions
                                detail={detail}
                                provider={provider}
                            />
                        }
                    />
                }
            >
                <ConnectionDetailContent detail={detail} />
            </PageFrame>
        </>
    );
}
