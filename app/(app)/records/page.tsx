import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { SetupCollectionEmptyState } from "@/components/onboarding/SetupCollectionEmptyState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import {
    getLensFromSearchParams,
    scopeIdsMatchLens,
    type SearchParamRecord,
} from "@/lib/lens";
import {
    applyObjectsIndexQuery,
    getDataSourceAdapters,
    type ObjectsIndexSortDir,
    type ObjectsIndexSortKey,
} from "@/lib/data-source";
import type { ObjectsIndexItem } from "@/lib/data-source";
import type { ObjectCoverageStatus } from "@/lib/stubs";
import { paginateItems, parsePageParam } from "@/lib/pagination";
import { logger } from "@/lib/logging/server-logger";
import Link from "next/link";
import { DocumentsIndexContent } from "./_components/DocumentsIndexContent";
import { buildDocumentsRouteContract } from "./_page-model/build";
import { enforceDocumentsRouteContract } from "./_page-model/validate";

interface DocumentsPageProps {
    searchParams: Promise<SearchParamRecord>;
}

const PAGE_SIZE = 20;

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
    const dataSource = getDataSourceAdapters();
    const resolvedSearchParams = await searchParams;
    const lens = getLensFromSearchParams(resolvedSearchParams);
    const query = getStringValue(resolvedSearchParams.q);
    const domain = getStringValue(resolvedSearchParams.domain);
    const statuses = parseStatusValues(resolvedSearchParams.status);
    const sortBy = parseSortBy(resolvedSearchParams.sortBy);
    const sortDir = parseSortDir(resolvedSearchParams.sortDir);
    const requestedPage = parsePageParam(resolvedSearchParams.page);

    const lensScopedObjects = dataSource.objects
        .getObjectsIndex()
        .items.filter((object) => scopeIdsMatchLens(object.scopeIds, lens));
    const objectsIndex = applyObjectsIndexQuery(lensScopedObjects, {
        filters: {
            search: query || undefined,
            domain: domain || undefined,
            status: statuses.length > 0 ? statuses : undefined,
        },
        sortBy,
        sortDir,
    });
    const objects = reduceToLatestVersions(objectsIndex.items);
    const { pagination, pageItems } = paginateItems(
        objects,
        requestedPage,
        PAGE_SIZE,
    );
    const contract = buildDocumentsRouteContract({
        scope: "documents_index",
        lens,
        documents: pageItems,
    });
    const { pageModelValidation, payload } =
        enforceDocumentsRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/records",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/records",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/records",
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
                        title="Documents"
                        description={
                            "Program artifacts and policy materials in scope."
                        }
                        separator={false}
                    />
                }
            >
                <div className="space-y-12 py-4">
                    <DocumentsIndexContent
                        lens={lens}
                        searchParams={resolvedSearchParams}
                        query={query}
                        domain={domain}
                        statuses={statuses}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        availableDomains={objectsIndex.availableDomains}
                        pageItems={pageItems}
                        pagination={pagination}
                        emptyState={
                            <SetupCollectionEmptyState
                                title="No documents created yet"
                                description="Your baseline policy pack and supporting documents will appear here once the first setup work is authored."
                                action={
                                    <Button asChild variant="outline">
                                        <Link href="/tasks">
                                            Create document
                                        </Link>
                                    </Button>
                                }
                            />
                        }
                    />
                </div>
            </PageFrame>
        </>
    );
}

function getStringValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return value ?? "";
}

function parseStatusValues(
    value: string | string[] | undefined,
): ObjectCoverageStatus[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];

    return values.filter(
        (item): item is ObjectCoverageStatus =>
            item === "complete" ||
            item === "blocked" ||
            item === "at_risk" ||
            item === "unmapped",
    );
}

function parseSortBy(
    value: string | string[] | undefined,
): ObjectsIndexSortKey {
    const resolved = getStringValue(value);

    if (
        resolved === "openTasks" ||
        resolved === "missingAttachments" ||
        resolved === "updated"
    ) {
        return resolved;
    }

    return "updated";
}

function parseSortDir(
    value: string | string[] | undefined,
): ObjectsIndexSortDir {
    return getStringValue(value) === "asc" ? "asc" : "desc";
}

function reduceToLatestVersions(
    objects: ObjectsIndexItem[],
): Array<ObjectsIndexItem & { versionCount: number }> {
    const byId = new Map<string, ObjectsIndexItem[]>();

    for (const object of objects) {
        const existing = byId.get(object.id);
        if (existing) {
            existing.push(object);
            continue;
        }
        byId.set(object.id, [object]);
    }

    return Array.from(byId.values())
        .map((versions) => {
            const latest = versions.reduce((current, next) =>
                next.version > current.version ? next : current,
            );
            const uniqueVersions = new Set(
                versions.map((item) => item.version),
            );
            return {
                ...latest,
                versionCount: uniqueVersions.size,
            };
        })
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        );
}
