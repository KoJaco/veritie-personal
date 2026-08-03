import type {
    ResourceCategory,
    ResourceCriticality,
    ResourceSensitivity,
    ResourceStub,
} from "@/lib/stubs";

export type ResourceStatus = "ready" | "partial" | "missing" | "unknown";

export type ResourceIndexSortKey =
    | "updated"
    | "criticality"
    | "category"
    | "tasks"
    | "attachments";
export type ResourceIndexSortDir = "asc" | "desc";

export interface ResourceIndexFilters {
    search?: string;
    categories?: ResourceCategory[];
    criticalities?: ResourceCriticality[];
    statuses?: ResourceStatus[];
}

export interface ResourceIndexQuery {
    filters?: ResourceIndexFilters;
    sortBy?: ResourceIndexSortKey;
    sortDir?: ResourceIndexSortDir;
}

export interface ResourceSummaryMetrics {
    totalResources: number;
    monitoredResources: number;
    resourcesWithEvidenceGaps: number;
    servicesCount: number;
}

export interface ResourceIndexReadModel {
    items: ResourceStub[];
    availableCategories: ResourceCategory[];
    availableCriticalities: ResourceCriticality[];
    summary: ResourceSummaryMetrics;
}

export interface CreateResourceInput {
    name: string;
    category: ResourceCategory;
    ownerName: string;
    ownerId?: string;
    criticality: ResourceCriticality;
    sensitivity: ResourceSensitivity;
    description?: string;
}

export interface CreateResourceResult {
    resourceId: string;
}

const CRITICALITY_ORDER: Record<ResourceCriticality, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
};

export function getResourceStatus(resource: ResourceStub): ResourceStatus {
    const { coverageFlags } = resource;
    const signals = [
        coverageFlags.hasOwner,
        coverageFlags.hasAttachments,
        coverageFlags.mappedToChecks,
        coverageFlags.monitored,
    ];
    const positiveCount = signals.filter(Boolean).length;

    if (positiveCount === signals.length) {
        return "ready";
    }

    if (positiveCount === 0) {
        return "unknown";
    }

    if (!coverageFlags.hasOwner && !coverageFlags.hasAttachments) {
        return "missing";
    }

    return "partial";
}

export function summarizeResources(items: ResourceStub[]): ResourceSummaryMetrics {
    return {
        totalResources: items.length,
        monitoredResources: items.filter((item) => item.coverageFlags.monitored)
            .length,
        resourcesWithEvidenceGaps: items.filter(
            (item) => !item.coverageFlags.hasAttachments,
        ).length,
        servicesCount: items.filter((item) => item.category === "service").length,
    };
}

export function applyResourcesIndexQuery(
    items: ResourceStub[],
    query?: ResourceIndexQuery,
): ResourceIndexReadModel {
    const availableCategories = Array.from(
        new Set(items.map((item) => item.category)),
    ).sort();
    const availableCriticalities = Array.from(
        new Set(items.map((item) => item.criticality)),
    ).sort((left, right) => CRITICALITY_ORDER[left] - CRITICALITY_ORDER[right]);

    const filtered = items.filter((item) => {
        const search = query?.filters?.search?.trim().toLowerCase();
        if (search) {
            const haystack = `${item.name} ${item.summary}`.toLowerCase();
            if (!haystack.includes(search)) {
                return false;
            }
        }

        const categories = query?.filters?.categories ?? [];
        if (categories.length > 0 && !categories.includes(item.category)) {
            return false;
        }

        const criticalities = query?.filters?.criticalities ?? [];
        if (
            criticalities.length > 0 &&
            !criticalities.includes(item.criticality)
        ) {
            return false;
        }

        const statuses = query?.filters?.statuses ?? [];
        if (statuses.length > 0 && !statuses.includes(getResourceStatus(item))) {
            return false;
        }

        return true;
    });

    const sortBy = query?.sortBy ?? "updated";
    const sortDir = query?.sortDir ?? "desc";
    const direction = sortDir === "asc" ? 1 : -1;

    filtered.sort((left, right) => {
        if (sortBy === "category") {
            return left.category.localeCompare(right.category) * direction;
        }

        if (sortBy === "criticality") {
            return (
                (CRITICALITY_ORDER[left.criticality] -
                    CRITICALITY_ORDER[right.criticality]) * direction
            );
        }

        if (sortBy === "tasks") {
            return (left.linkedTasksCount - right.linkedTasksCount) * direction;
        }

        if (sortBy === "attachments") {
            return (
                (left.linkedAttachmentCount - right.linkedAttachmentCount) *
                direction
            );
        }

        return (
            (new Date(left.updatedAt).getTime() -
                new Date(right.updatedAt).getTime()) * direction
        );
    });

    return {
        items: filtered,
        availableCategories,
        availableCriticalities,
        summary: summarizeResources(filtered),
    };
}
