import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { SetupCollectionEmptyState } from "@/components/onboarding/SetupCollectionEmptyState";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { ResourceCreateFlow } from "@/components/resources/ResourceCreateFlow";
import {
    applyResourcesIndexQuery,
    getDataSourceAdapters,
    type ResourceIndexSortDir,
    type ResourceIndexSortKey,
    type ResourceStatus,
} from "@/lib/data-source";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { parsePageParam, paginateItems } from "@/lib/pagination";
import { logger } from "@/lib/logging/server-logger";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";
import type { ResourceCategory, ResourceCriticality } from "@/lib/stubs";
import { ResourcesInventorySection } from "./_components/ResourcesInventorySection";
import { ResourcesOverviewSection } from "./_components/ResourcesOverviewSection";
import { buildResourcesRouteContract } from "./_page-model/build";
import { enforceResourcesRouteContract } from "./_page-model/validate";

interface ResourcesPageProps {
    searchParams: Promise<SearchParamRecord>;
}

const PAGE_SIZE = 12;

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
    const bootstrap = await getStubServerBootstrap();
    const resolvedSearchParams = await searchParams;
    const lens = getLensFromSearchParams(resolvedSearchParams);
    const dataSource = getDataSourceAdapters();
    const query = getStringValue(resolvedSearchParams.q);
    const categories = parseCategoryValues(resolvedSearchParams.category);
    const criticalities = parseCriticalityValues(
        resolvedSearchParams.criticality,
    );
    const statuses = parseStatusValues(resolvedSearchParams.status);
    const sortBy = parseSortBy(resolvedSearchParams.sortBy);
    const sortDir = parseSortDir(resolvedSearchParams.sortDir);
    const requestedPage = parsePageParam(resolvedSearchParams.page);

    const resourcesIndex = applyResourcesIndexQuery(
        dataSource.resources.getResourcesIndex().items,
        {
            filters: {
                search: query || undefined,
                categories: categories.length > 0 ? categories : undefined,
                criticalities:
                    criticalities.length > 0 ? criticalities : undefined,
                statuses: statuses.length > 0 ? statuses : undefined,
            },
            sortBy,
            sortDir,
        },
    );
    const { pagination, pageItems } = paginateItems(
        resourcesIndex.items,
        requestedPage,
        PAGE_SIZE,
    );
    const freshSummary = {
        totalResources: 0,
        servicesCount: 0,
        monitoredResources: 0,
        resourcesWithEvidenceGaps: 0,
    };
    const freshPagination = {
        currentPage: 1,
        totalPages: 1,
        rangeStart: 0,
        rangeEnd: 0,
        totalItems: 0,
    };
    const displayedSummary = freshSummary;
    const displayedPageItems: typeof pageItems = [];
    const displayedPagination = freshPagination;

    const contract = buildResourcesRouteContract({
        scope: "resources_index",
        lens,
        resourcesSummary: displayedSummary,
        visibleResources: displayedPageItems,
    });
    const { pageModelValidation, payload } = enforceResourcesRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/resources",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/resources",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/resources",
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
                        title="Resources"
                        separator={false}
                        actions={<ResourceCreateFlow />}
                    />
                }
            >
                <div className="space-y-12 py-4">
                    <ResourcesOverviewSection summary={displayedSummary} />

                    <ResourcesInventorySection
                        searchParams={resolvedSearchParams}
                        query={query}
                        categories={categories}
                        criticalities={criticalities}
                        statuses={statuses}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        availableCategories={resourcesIndex.availableCategories}
                        availableCriticalities={
                            resourcesIndex.availableCriticalities
                        }
                        pageItems={displayedPageItems}
                        pagination={displayedPagination}
                        emptyState={
                            <SetupCollectionEmptyState
                                title="No resources added yet"
                                description="Track your first service, datastore, device, or business entity here once setup starts turning into real inventory."
                                action={<ResourceCreateFlow />}
                            />
                        }
                    />
                </div>
            </PageFrame>
        </>
    );
}

function getStringValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseCategoryValues(
    value: string | string[] | undefined,
): ResourceCategory[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.filter(
        (item): item is ResourceCategory =>
            item === "device" ||
            item === "service" ||
            item === "resource" ||
            item === "entity",
    );
}

function parseCriticalityValues(
    value: string | string[] | undefined,
): ResourceCriticality[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.filter(
        (item): item is ResourceCriticality =>
            item === "low" ||
            item === "medium" ||
            item === "high" ||
            item === "critical",
    );
}

function parseSortBy(value: string | string[] | undefined): ResourceIndexSortKey {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (
        resolved === "updated" ||
        resolved === "tasks" ||
        resolved === "attachments" ||
        resolved === "criticality" ||
        resolved === "category"
    ) {
        return resolved;
    }
    return "updated";
}

function parseSortDir(value: string | string[] | undefined): ResourceIndexSortDir {
    const resolved = Array.isArray(value) ? value[0] : value;
    return resolved === "asc" ? "asc" : "desc";
}

function parseStatusValues(
    value: string | string[] | undefined,
): ResourceStatus[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.filter(
        (item): item is ResourceStatus =>
            item === "ready" ||
            item === "partial" ||
            item === "missing" ||
            item === "unknown",
    );
}
