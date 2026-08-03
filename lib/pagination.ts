export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
}

export function parsePageParam(
    value: string | string[] | undefined,
    fallback = 1,
): number {
    const resolved = Array.isArray(value) ? value[0] : value;
    const parsed = Number.parseInt(resolved ?? "", 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
}

export function clampPage(page: number, totalPages: number): number {
    if (totalPages <= 0) {
        return 1;
    }

    return Math.min(Math.max(page, 1), totalPages);
}

export function buildPaginationState(
    totalItems: number,
    requestedPage: number,
    pageSize: number,
): PaginationState {
    const safeTotalItems = Math.max(0, totalItems);
    const safePageSize = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
    const currentPage = clampPage(requestedPage, totalPages);

    if (safeTotalItems === 0) {
        return {
            currentPage: 1,
            pageSize: safePageSize,
            totalItems: 0,
            totalPages: 1,
            rangeStart: 0,
            rangeEnd: 0,
        };
    }

    const rangeStart = (currentPage - 1) * safePageSize + 1;
    const rangeEnd = Math.min(currentPage * safePageSize, safeTotalItems);

    return {
        currentPage,
        pageSize: safePageSize,
        totalItems: safeTotalItems,
        totalPages,
        rangeStart,
        rangeEnd,
    };
}

export function paginateItems<T>(
    items: readonly T[],
    requestedPage: number,
    pageSize: number,
) {
    const pagination = buildPaginationState(items.length, requestedPage, pageSize);
    const startIndex = Math.max(0, pagination.rangeStart - 1);
    const pageItems =
        items.length === 0
            ? []
            : items.slice(startIndex, startIndex + pagination.pageSize);

    return {
        pagination,
        pageItems,
    };
}
