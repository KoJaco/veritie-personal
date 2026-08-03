import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type {
    ConnectionDetailReadModel,
    ConnectionIndexItemReadModel,
} from "@/lib/data-source";
import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";

export type ConnectionsRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

type BuildConnectionsRouteContractParams =
    | {
          scope: "connections_index";
          lens: ScopeLens;
          visibleConnections: ConnectionIndexItemReadModel[];
      }
    | {
          scope: "connections_detail";
          lens: ScopeLens;
          connectionDetail: ConnectionDetailReadModel;
      };

export function buildConnectionsRouteContract(
    params: BuildConnectionsRouteContractParams,
): ConnectionsRouteContract {
    if (params.scope === "connections_index") {
        const items = params.visibleConnections;

        return {
            pageModel: {
                meta: {
                    title: "Connections",
                    description:
                        "Integration catalog and automation coverage status.",
                    breadcrumbs: [
                        { label: "Work", href: "/work" },
                        { label: "Connections" },
                    ],
                    scope: { scopeId: params.lens.scope },
                },
                view: {
                    key: "connections_index",
                    featureFlags: {
                        hasScopeFilter: params.lens.scope !== "all",
                    },
                },
                refs: {
                    visible: items.map(toConnectionEntityRef),
                },
                sections: [
                    {
                        key: "connections_catalog",
                        title: "Catalog",
                        kind: "connections_catalog",
                        items: items.map((connection) => ({
                            kind: "connection",
                            id: connection.id,
                            title: connection.label,
                            summary: connection.status,
                            ...(connection.detailHref
                                ? { href: connection.detailHref }
                                : {}),
                        })),
                    },
                ],
                capabilities: {
                    canUseContextRail: true,
                },
                actions: {
                    available: ["connections/open", "context/toggleRail"],
                },
            },
            railPayloadCandidate: buildRailPayload({
                scope: { type: "connections_index" },
                lens: params.lens,
            }),
        };
    }

    return {
        pageModel: {
            meta: {
                title: params.connectionDetail.label,
                description: params.connectionDetail.coverageSummary,
                breadcrumbs: [
                    { label: "Work", href: "/work" },
                    { label: "Connections", href: "/work/connections" },
                    { label: params.connectionDetail.label },
                ],
                scope: { scopeId: params.lens.scope },
            },
            view: {
                key: "connections_detail",
                featureFlags: {
                    hasScopeFilter: params.lens.scope !== "all",
                },
            },
            refs: {
                primary: {
                    kind: "connection",
                    id: params.connectionDetail.id,
                    title: params.connectionDetail.label,
                    summary: params.connectionDetail.status,
                    href: `/work/connections/${params.connectionDetail.id}`,
                },
            },
            sections: [
                {
                    key: "connection_overview",
                    title: "Overview",
                    kind: "connection_overview",
                    dataRef: {
                        kind: "connection",
                        id: params.connectionDetail.id,
                    },
                },
                {
                    key: "connection_generated_attachments",
                    title: "Generated Attachments",
                    kind: "attachments_list",
                    items: params.connectionDetail.generatedAttachments.map(
                        (attachment) => ({
                            kind: "attachment",
                            id: attachment.id,
                            title: attachment.title,
                            summary: attachment.status,
                            href: attachment.href,
                        }),
                    ),
                },
            ],
            capabilities: {
                canUseContextRail: true,
            },
            actions: {
                available: ["connections/open", "context/toggleRail"],
            },
        },
        railPayloadCandidate: buildRailPayload({
            scope: {
                type: "connections_detail",
                id: params.connectionDetail.id,
            },
            lens: params.lens,
        }),
    };
}

function toConnectionEntityRef(connection: ConnectionIndexItemReadModel) {
    return {
        kind: "connection",
        id: connection.id,
        title: connection.label,
        summary: connection.status,
        ...(connection.detailHref ? { href: connection.detailHref } : {}),
    };
}
