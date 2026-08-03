import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { IndexPagination } from "@/components/route";
import {
    getResourceStatus,
    type ResourceStatus,
    type ResourceIndexItem,
    type ResourceIndexSortDir,
    type ResourceIndexSortKey,
} from "@/lib/data-source";
import { resourceCategoryLabel, resourceCriticalityLabel } from "@/lib/resources/labels";
import type { SearchParamRecord } from "@/lib/lens";
import { formatRelativeDate } from "@/lib/format/date";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ResourcesFilters } from "./ResourcesFilters";
import type { ResourceCategory, ResourceCriticality } from "@/lib/stubs";
import { cn } from "@/lib/utils";

type ResourcesInventorySectionProps = {
    searchParams: SearchParamRecord;
    query: string;
    categories: ResourceCategory[];
    criticalities: ResourceCriticality[];
    statuses: ResourceStatus[];
    sortBy: ResourceIndexSortKey;
    sortDir: ResourceIndexSortDir;
    availableCategories: ResourceCategory[];
    availableCriticalities: ResourceCriticality[];
    pageItems: ResourceIndexItem[];
    pagination: {
        currentPage: number;
        totalPages: number;
        rangeStart: number;
        rangeEnd: number;
        totalItems: number;
    };
    emptyState?: React.ReactNode;
};

export function ResourcesInventorySection({
    searchParams,
    query,
    categories,
    criticalities,
    statuses,
    sortBy,
    sortDir,
    availableCategories,
    availableCriticalities,
    pageItems,
    pagination,
    emptyState,
}: ResourcesInventorySectionProps) {
    return (
        <section className="space-y-4">
            <div className="max-w-3xl space-y-1">
                <h2 className="text-base font-semibold">
                    Real-world resource inventory
                </h2>
                <p className="text-sm text-muted-foreground">
                    Resources capture devices, services, shared systems, and
                    operational entities. Connections remain separate
                    automation sources under Work.
                </p>
            </div>

            <div className={`${SURFACE_CLASS}`}>
                <div className="border-b px-3 py-3">
                    <ResourcesFilters
                        initialQuery={query}
                        initialCategories={categories}
                        initialCriticalities={criticalities}
                        initialStatuses={statuses}
                        availableCategories={availableCategories}
                        availableCriticalities={availableCriticalities}
                    />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[280px] pl-3.5">
                                Name
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Criticality</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <SortableHeader
                                    label="Tasks"
                                    sortKey="tasks"
                                    searchParams={searchParams}
                                    activeSortBy={sortBy}
                                    activeSortDir={sortDir}
                                />
                            </TableHead>
                            <TableHead>
                                <SortableHeader
                                    label="Attachments"
                                    sortKey="attachments"
                                    searchParams={searchParams}
                                    activeSortBy={sortBy}
                                    activeSortDir={sortDir}
                                />
                            </TableHead>
                            <TableHead>
                                <SortableHeader
                                    label="Last Updated"
                                    sortKey="updated"
                                    searchParams={searchParams}
                                    activeSortBy={sortBy}
                                    activeSortDir={sortDir}
                                />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="px-3">
                        {pageItems.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="p-0"
                                >
                                    {emptyState ?? (
                                        <div className="h-24 text-center text-muted-foreground">
                                            No resources found for the current
                                            filters.
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageItems.map((resource) => (
                                <TableRow key={resource.id}>
                                    <TableCell>
                                        <div className="space-y-1 py-1 px-1.5">
                                            <Link
                                                href={`/work/resources/${resource.id}`}
                                                className="font-medium hover:text-primary"
                                            >
                                                {resource.name}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {resourceCategoryLabel(resource.category)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {resource.owner?.name ?? "Unassigned"}
                                    </TableCell>
                                    <TableCell>
                                        {resourceCriticalityLabel(
                                            resource.criticality,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <ResourceStatusBadge resource={resource} />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {resource.linkedTasksCount} open
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {resource.linkedAttachmentCount} attached
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatRelativeDate(resource.updatedAt)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <IndexPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    rangeStart={pagination.rangeStart}
                    rangeEnd={pagination.rangeEnd}
                    totalItems={pagination.totalItems}
                    hrefForPage={(page) =>
                        buildResourcesIndexHref({
                            q: query || null,
                            category: categories.length > 0 ? categories : null,
                            criticality:
                                criticalities.length > 0 ? criticalities : null,
                            status: statuses.length > 0 ? statuses : null,
                            sortBy,
                            sortDir,
                            page: page <= 1 ? null : String(page),
                        })
                    }
                />
            </div>
        </section>
    );
}

function SortableHeader({
    label,
    sortKey,
    searchParams,
    activeSortBy,
    activeSortDir,
}: {
    label: string;
    sortKey: ResourceIndexSortKey;
    searchParams: SearchParamRecord;
    activeSortBy: ResourceIndexSortKey;
    activeSortDir: ResourceIndexSortDir;
}) {
    const isActive = activeSortBy === sortKey;
    const nextSortDir = !isActive || activeSortDir === "desc" ? "asc" : "desc";

    return (
        <Link
            href={buildResourcesIndexHref({
                q: getStringValue(searchParams.q) || null,
                category: parseCategoryValues(searchParams.category),
                criticality: parseCriticalityValues(searchParams.criticality),
                status: parseStatusValues(searchParams.status),
                sortBy: sortKey,
                sortDir: nextSortDir,
                page: null,
            })}
            aria-label={`Sort ${label.toLowerCase()} ${nextSortDir === "asc" ? "ascending" : "descending"}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
            {label}
            <span className="inline-flex items-center gap-0.5 leading-none">
                <ArrowUp
                    className={cn(
                        "h-3 w-3",
                        isActive && activeSortDir === "asc"
                            ? "text-foreground"
                            : "text-muted-foreground",
                    )}
                />
                <ArrowDown
                    className={cn(
                        "h-3 w-3",
                        isActive && activeSortDir === "desc"
                            ? "text-foreground"
                            : "text-muted-foreground",
                    )}
                />
            </span>
        </Link>
    );
}

function ResourceStatusBadge({ resource }: { resource: ResourceIndexItem }) {
    const status = getResourceStatusMeta(resource);

    return (
        <Badge
            variant="outline"
            className={cn("text-[11px]", status.className)}
        >
            {status.label}
        </Badge>
    );
}

function getResourceStatusMeta(resource: ResourceIndexItem): {
    label: "Ready" | "Partial" | "Missing" | "Unknown";
    className: string;
} {
    const status = getResourceStatus(resource);

    if (status === "ready") {
        return {
            label: "Ready",
            className:
                "border-emerald-300/70 text-emerald-700 dark:text-emerald-400",
        };
    }

    if (status === "unknown") {
        return {
            label: "Unknown",
            className: "border-slate-300/70 text-slate-700 dark:text-slate-300",
        };
    }

    if (status === "missing") {
        return {
            label: "Missing",
            className: "border-rose-300/70 text-rose-700 dark:text-rose-400",
        };
    }

    return {
        label: "Partial",
        className: "border-amber-300/70 text-amber-700 dark:text-amber-400",
    };
}

function getStringValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function buildResourcesIndexHref(params: {
    q?: string | null;
    category?: ResourceCategory[] | null;
    criticality?: ResourceCriticality[] | null;
    status?: ResourceStatus[] | null;
    sortBy?: ResourceIndexSortKey | null;
    sortDir?: ResourceIndexSortDir | null;
    page?: string | null;
}) {
    const searchParams = new URLSearchParams();

    appendParam(searchParams, "q", params.q);
    appendParams(searchParams, "category", params.category);
    appendParams(searchParams, "criticality", params.criticality);
    appendParams(searchParams, "status", params.status);
    appendParam(searchParams, "sortBy", params.sortBy);
    appendParam(searchParams, "sortDir", params.sortDir);
    appendParam(searchParams, "page", params.page);

    const query = searchParams.toString();
    return query ? `/work/resources?${query}` : "/work/resources";
}

function appendParam(
    searchParams: URLSearchParams,
    key: string,
    value?: string | null,
) {
    if (value) {
        searchParams.set(key, value);
    }
}

function appendParams(
    searchParams: URLSearchParams,
    key: string,
    values?: string[] | null,
) {
    if (!values) return;

    for (const value of values) {
        searchParams.append(key, value);
    }
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
