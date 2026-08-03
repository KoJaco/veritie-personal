import { PageFrame } from "@/components/static/PageFrame";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { PageHeader } from "@/components/route";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { ConnectionIndexItemReadModel } from "@/lib/data-source";
import { logger } from "@/lib/logging/server-logger";
import { ConnectionsCatalogClient } from "./_components/ConnectionsCatalogClient";
import { buildConnectionsRouteContract } from "./_page-model/build";
import { enforceConnectionsRouteContract } from "./_page-model/validate";

interface ConnectionsPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function ConnectionsPage({
    searchParams,
}: ConnectionsPageProps) {
    const lens = getLensFromSearchParams(await searchParams);
    const connectionsIndex =
        getDataSourceAdapters().connections.getConnectionsIndex();
    const freshDisconnected: ConnectionIndexItemReadModel[] =
        connectionsIndex.providerOptions.map((provider) => ({
            id: `fresh_${provider.key}`,
            key: provider.key,
            label: provider.label,
            status: "disconnected",
            healthStatus: "inactive",
            coverageSummary: provider.coverageSummary,
            group: "disconnected",
            actionLabel: "Connect",
        }));
    const connectedConnections: ConnectionIndexItemReadModel[] = [];
    const disconnectedConnections = freshDisconnected;
    const visibleConnections = [
        ...connectedConnections,
        ...disconnectedConnections,
    ];
    const contract = buildConnectionsRouteContract({
        scope: "connections_index",
        lens,
        visibleConnections,
    });
    const { pageModelValidation, payload } =
        enforceConnectionsRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/work/connections",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/work/connections",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/work/connections",
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes,
        });
    }

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={<PageHeader title="Connections" separator={false} />}
            >
                <div className="py-6">
                    <ConnectionsCatalogClient
                        connected={connectedConnections}
                        disconnected={disconnectedConnections}
                        providerOptions={connectionsIndex.providerOptions}
                    />
                </div>
            </PageFrame>
        </>
    );
}
