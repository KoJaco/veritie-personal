import type {
    ObjectCoverageStatus,
    ObjectDetailStub,
    ObjectStub,
} from "@/lib/stubs";

export type ObjectsIndexSortKey = "openTasks" | "missingAttachments" | "updated";
export type ObjectsIndexSortDir = "asc" | "desc";

export interface ObjectsIndexItem
    extends Omit<ObjectStub, "missingAttachmentCount"> {
    missingAttachmentCount: number;
}

export type ObjectAttachmentSummaryReadModel =
    ObjectDetailStub["linkedAttachments"][number];

export interface ObjectsIndexFilters {
    search?: string;
    domain?: string;
    status?: ObjectCoverageStatus[];
}

export interface ObjectsIndexQuery {
    filters?: ObjectsIndexFilters;
    sortBy?: ObjectsIndexSortKey;
    sortDir?: ObjectsIndexSortDir;
}

export interface ObjectsIndexReadModel {
    items: ObjectsIndexItem[];
    availableDomains: string[];
}

export function applyObjectsIndexQuery(
    items: Array<ObjectStub | ObjectsIndexItem>,
    query?: ObjectsIndexQuery,
): ObjectsIndexReadModel {
    const readModelItems = items.map(mapObjectStubToIndexItem);
    const availableDomains = Array.from(
        new Set(
            readModelItems
                .map((item) => item.domain.trim())
                .filter((domain) => domain.length > 0),
        ),
    ).sort((left, right) => left.localeCompare(right));

    const filtered = readModelItems.filter((item) => {
        const searchTerm = query?.filters?.search?.trim().toLowerCase();

        if (searchTerm && !item.title.toLowerCase().includes(searchTerm)) {
            return false;
        }

        if (query?.filters?.domain && item.domain !== query.filters.domain) {
            return false;
        }

        if (
            query?.filters?.status &&
            query.filters.status.length > 0 &&
            !query.filters.status.includes(item.coverageStatus)
        ) {
            return false;
        }

        return true;
    });

    const sortBy = query?.sortBy ?? "updated";
    const sortDir = query?.sortDir ?? "desc";
    const direction = sortDir === "asc" ? 1 : -1;

    filtered.sort((left, right) => {
        if (sortBy === "openTasks") {
            return (
                (left.linkedTasksCount - right.linkedTasksCount) * direction
            );
        }

        if (sortBy === "missingAttachments") {
            return (
                (left.missingAttachmentCount - right.missingAttachmentCount) *
                direction
            );
        }

        const leftTime = new Date(left.updatedAt).getTime();
        const rightTime = new Date(right.updatedAt).getTime();
        return (leftTime - rightTime) * direction;
    });

    return {
        items: filtered,
        availableDomains,
    };
}

function mapObjectStubToIndexItem(item: ObjectStub | ObjectsIndexItem): ObjectsIndexItem {
    return {
        ...item,
        missingAttachmentCount: item.missingAttachmentCount,
        scopeIds: [...(item.scopeIds ?? [])],
    };
}

export function getObjectAttachmentSummaries(
    object: ObjectDetailStub,
): ObjectAttachmentSummaryReadModel[] {
    return object.linkedAttachments.map((attachment) => ({ ...attachment }));
}
