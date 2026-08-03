import Link from "next/link";
import { IndexPagination } from "@/components/route";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    filterScopeIdsForLens,
    getScopeLabel,
    withLens,
    type ScopeKey,
    type ScopeLens,
    type SearchParamRecord,
} from "@/lib/lens";
import { formatRelativeDate } from "@/lib/format/date";
import type {
    ObjectsIndexItem,
    ObjectsIndexSortDir,
    ObjectsIndexSortKey,
} from "@/lib/data-source";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ObjectCoverageStatus } from "@/lib/stubs";
import { DocumentsFilters } from "./DocumentsFilters";

type DocumentsIndexContentProps = {
    lens: ScopeLens;
    searchParams: SearchParamRecord;
    query: string;
    domain: string;
    statuses: ObjectCoverageStatus[];
    sortBy: ObjectsIndexSortKey;
    sortDir: ObjectsIndexSortDir;
    availableDomains: string[];
    pageItems: Array<ObjectsIndexItem & { versionCount: number }>;
    pagination: {
        currentPage: number;
        totalPages: number;
        rangeStart: number;
        rangeEnd: number;
        totalItems: number;
    };
    emptyState?: React.ReactNode;
};

export function DocumentsIndexContent({
    lens,
    searchParams,
    query,
    domain,
    statuses,
    sortBy,
    sortDir,
    availableDomains,
    pageItems,
    pagination,
    emptyState,
}: DocumentsIndexContentProps) {
    return (
        <section className={cn(SURFACE_CLASS, "p-0")}>
            <div className="border-b px-1.5 py-3">
                <DocumentsFilters
                    lens={lens}
                    initialQuery={query}
                    initialDomain={domain}
                    initialStatuses={statuses}
                    availableDomains={availableDomains}
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[260px]">Document</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">
                            <SortableColumnHeader
                                label="Open tasks"
                                sortByKey="openTasks"
                                activeSortBy={sortBy}
                                activeSortDir={sortDir}
                                hrefFor={(nextSortDir) =>
                                    makeSortHref(
                                        lens,
                                        searchParams,
                                        "openTasks",
                                        nextSortDir,
                                    )
                                }
                            />
                        </TableHead>
                        <TableHead className="text-right">
                            <SortableColumnHeader
                                label="Missing attachments"
                                sortByKey="missingAttachments"
                                activeSortBy={sortBy}
                                activeSortDir={sortDir}
                                hrefFor={(nextSortDir) =>
                                    makeSortHref(
                                        lens,
                                        searchParams,
                                        "missingAttachments",
                                        nextSortDir,
                                    )
                                }
                            />
                        </TableHead>
                        <TableHead className="min-w-[220px]">
                            Scopes
                        </TableHead>
                        <TableHead>
                            <SortableColumnHeader
                                label="Updated"
                                sortByKey="updated"
                                activeSortBy={sortBy}
                                activeSortDir={sortDir}
                                hrefFor={(nextSortDir) =>
                                    makeSortHref(
                                        lens,
                                        searchParams,
                                        "updated",
                                        nextSortDir,
                                    )
                                }
                            />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageItems.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="p-0"
                            >
                                {emptyState ?? (
                                    <div className="h-20 text-center text-muted-foreground">
                                        No documents found for the current
                                        filters.
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ) : (
                        pageItems.map((document, index) => {
                            const status = coverageStatusDisplay(
                                document.coverageStatus,
                            );
                            const scopedIds = filterScopeIdsForLens(
                                document.scopeIds,
                                lens,
                            );

                            return (
                                <TableRow key={`${document.id}-${index}`}>
                                    <TableCell className="align-center">
                                        <div className="space-y-1 py-1">
                                            <Link
                                                href={withLens(
                                                    `/work/documents/${document.id}`,
                                                    lens,
                                                )}
                                                className="flex items-center gap-2 font-medium text-foreground hover:text-primary"
                                            >
                                                {document.title}
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[11px]"
                                                    >
                                                        {document.objectType}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[11px]"
                                                    >
                                                        v{document.version}
                                                    </Badge>
                                                </div>
                                            </Link>
                                            <p className="line-clamp-2 text-xs text-muted-foreground">
                                                {document.summary}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{document.domain}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={status.className}
                                        >
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {document.linkedTasksCount}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {document.missingAttachmentCount}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(scopedIds.length > 0
                                                ? scopedIds
                                                : ["UNMAPPED"]
                                            ).map((scopeId) => (
                                                <Badge
                                                    key={`${document.id}-${scopeId}`}
                                                    variant="outline"
                                                    className="text-[11px]"
                                                >
                                                    {scopeId === "UNMAPPED"
                                                        ? "Unmapped"
                                                        : getScopeLabel(scopeId as ScopeKey)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatRelativeDate(document.updatedAt)}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
            <IndexPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                totalItems={pagination.totalItems}
                hrefForPage={(page) => makePageHref(lens, searchParams, page)}
            />
        </section>
    );
}

function coverageStatusDisplay(status: ObjectsIndexItem["coverageStatus"]): {
    label: string;
    className: string;
} {
    if (status === "complete") {
        return {
            label: "Complete",
            className:
                "border-emerald-300/70 text-emerald-700 dark:text-emerald-400",
        };
    }

    if (status === "blocked") {
        return {
            label: "Blocked",
            className: "border-rose-300/70 text-rose-700 dark:text-rose-400",
        };
    }

    if (status === "at_risk") {
        return {
            label: "At risk",
            className: "border-amber-300/70 text-amber-700 dark:text-amber-400",
        };
    }

    return {
        label: "Unmapped",
        className: "border-slate-300/70 text-slate-700 dark:text-slate-300",
    };
}

function getStringValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return value ?? "";
}

function makeSortHref(
    lens: ScopeLens,
    params: SearchParamRecord,
    sortBy: ObjectsIndexSortKey,
    sortDir: ObjectsIndexSortDir,
): string {
    return withLens("/work/documents", lens, {
        q: getStringValue(params.q) || null,
        domain: getStringValue(params.domain) || null,
        status: Array.isArray(params.status)
            ? params.status
            : getStringValue(params.status)
              ? [getStringValue(params.status)]
              : null,
        sortBy,
        sortDir,
        page: getStringValue(params.page) || null,
    });
}

function makePageHref(
    lens: ScopeLens,
    params: SearchParamRecord,
    page: number,
): string {
    return withLens("/work/documents", lens, {
        q: getStringValue(params.q) || null,
        domain: getStringValue(params.domain) || null,
        status: Array.isArray(params.status)
            ? params.status
            : getStringValue(params.status)
              ? [getStringValue(params.status)]
              : null,
        sortBy: getStringValue(params.sortBy) || null,
        sortDir: getStringValue(params.sortDir) || null,
        page: page > 1 ? String(page) : null,
    });
}

function SortableColumnHeader({
    label,
    sortByKey,
    activeSortBy,
    activeSortDir,
    hrefFor,
}: {
    label: string;
    sortByKey: ObjectsIndexSortKey;
    activeSortBy: ObjectsIndexSortKey;
    activeSortDir: ObjectsIndexSortDir;
    hrefFor: (nextSortDir: ObjectsIndexSortDir) => string;
}) {
    const ascActive = activeSortBy === sortByKey && activeSortDir === "asc";
    const descActive = activeSortBy === sortByKey && activeSortDir === "desc";

    return (
        <div className="flex items-center justify-end gap-1.5">
            <span>{label}</span>
            <div className="flex items-center gap-0.5">
                <Link
                    href={hrefFor("asc")}
                    aria-label={`Sort ${label} ascending`}
                    className={cn(
                        "inline-flex rounded p-0.5 text-muted-foreground hover:text-foreground",
                        ascActive && "text-primary",
                    )}
                >
                    <ArrowUp className="h-3.5 w-3.5" />
                </Link>
                <Link
                    href={hrefFor("desc")}
                    aria-label={`Sort ${label} descending`}
                    className={cn(
                        "inline-flex rounded p-0.5 text-muted-foreground hover:text-foreground",
                        descActive && "text-primary",
                    )}
                >
                    <ArrowDown className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}
