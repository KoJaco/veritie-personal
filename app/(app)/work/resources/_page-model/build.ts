import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { ResourceIndexItem, ResourceIndexReadModel } from "@/lib/data-source";
import type { ResourceDetailStub } from "@/lib/stubs";
import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";

export type ResourcesRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

type BuildResourcesRouteContractParams =
    | {
          scope: "resources_index";
          lens: ScopeLens;
          resourcesSummary: ResourceIndexReadModel["summary"];
          visibleResources: ResourceIndexItem[];
      }
    | {
          scope: "resources_detail";
          lens: ScopeLens;
          resource: ResourceDetailStub;
      };

function buildResourcesIndexPageModel({
    lens,
    resourcesSummary,
    visibleResources,
}: {
    lens: ScopeLens;
    resourcesSummary: ResourceIndexReadModel["summary"];
    visibleResources: ResourceIndexItem[];
}): PageModel {
    return {
        meta: {
            title: "Resources",
            description: "Operational resources and service coverage in scope.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Resources" },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "resources_index",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            visible: visibleResources.map((resource) => ({
                kind: "resource",
                id: resource.id,
                title: resource.name,
                summary: resource.category,
                href: `/work/resources/${resource.id}`,
            })),
        },
        sections: [
            {
                key: "resources_snapshot",
                title: "Snapshot",
                kind: "metrics_grid",
                items: [
                    {
                        kind: "metric",
                        id: "resources_total",
                        summary: String(resourcesSummary.totalResources),
                    },
                    {
                        kind: "metric",
                        id: "resources_monitored",
                        summary: String(resourcesSummary.monitoredResources),
                    },
                    {
                        kind: "metric",
                        id: "resources_gaps",
                        summary: String(resourcesSummary.resourcesWithEvidenceGaps),
                    },
                    {
                        kind: "metric",
                        id: "resources_services",
                        summary: String(resourcesSummary.servicesCount),
                    },
                ],
            },
            {
                key: "resources_inventory",
                title: "Inventory",
                kind: "resources_list",
                items: visibleResources.map((resource) => ({
                    kind: "resource",
                    id: resource.id,
                    summary: resource.name,
                })),
            },
        ],
        capabilities: {
            canCreateResource: true,
            canUseContextRail: true,
        },
        actions: {
            available: ["resources/create", "resources/open", "context/toggleRail"],
        },
    };
}

function buildResourceDetailPageModel({
    lens,
    resource,
}: {
    lens: ScopeLens;
    resource: ResourceDetailStub;
}): PageModel {
    return {
        meta: {
            title: resource.name,
            description: resource.summary,
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Resources", href: "/work/resources" },
                { label: resource.name },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "resources_detail",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            primary: {
                kind: "resource",
                id: resource.id,
                title: resource.name,
                summary: resource.category,
                href: `/work/resources/${resource.id}`,
            },
        },
        sections: [
            {
                key: "resource_summary",
                title: "Summary",
                kind: "resource_summary",
                dataRef: { kind: "resource", id: resource.id },
            },
            {
                key: "resource_checks",
                title: "Linked Checks",
                kind: "checks_list",
                items: resource.linkedChecks.map((check) => ({
                    kind: "check",
                    id: check.id,
                    summary: check.title,
                })),
            },
            {
                key: "resource_attachments",
                title: "Linked Attachments",
                kind: "attachments_list",
                items: resource.linkedAttachments.map((attachment) => ({
                    kind: "attachment",
                    id: attachment.id,
                    summary: attachment.filename,
                })),
            },
        ],
        capabilities: {
            canUploadAttachment: true,
            canUseContextRail: true,
        },
        actions: {
            available: ["attachments/upload", "resources/open", "context/toggleRail"],
        },
    };
}

export function buildResourcesRouteContract(
    params: BuildResourcesRouteContractParams,
): ResourcesRouteContract {
    if (params.scope === "resources_index") {
        return {
            pageModel: buildResourcesIndexPageModel({
                lens: params.lens,
                resourcesSummary: params.resourcesSummary,
                visibleResources: params.visibleResources,
            }),
            railPayloadCandidate: buildRailPayload({
                scope: { type: "resources_index" },
                lens: params.lens,
            }),
        };
    }

    return {
        pageModel: buildResourceDetailPageModel({
            lens: params.lens,
            resource: params.resource,
        }),
        railPayloadCandidate: buildRailPayload({
            scope: { type: "resources_detail", id: params.resource.id },
            primaryObject: { type: "resource", id: params.resource.id },
            lens: params.lens,
        }),
    };
}
