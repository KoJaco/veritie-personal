import { withLens } from "./utils";
import type { ScopeKey, ScopeLens } from "./types";

export type ScopeReadModelKey =
    | "control_aggregates"
    | "dashboard_metrics"
    | "task_work_queue";

export type ScopeCacheTagPolicy = {
    namespace: "scope_view";
    version: "v1";
    readModels: readonly ScopeReadModelKey[];
};

export type ScopeSurface =
    | "dashboard"
    | "tasks"
    | "documents"
    | "resources";

export type ScopeBoundOptions = {
    lens: ScopeLens;
    surface: ScopeSurface;
    requested: number;
};

export const SCOPE_CACHE_TAG_POLICY: ScopeCacheTagPolicy = {
    namespace: "scope_view",
    version: "v1",
    readModels: ["control_aggregates", "dashboard_metrics", "task_work_queue"],
};

export const SCOPE_ALL_BOUNDS: Record<ScopeSurface, number> =
    {
        dashboard: 32,
        tasks: 48,
        documents: 24,
        resources: 24,
    };

export function scopeIdsMatchLens(
    scopeIds: ScopeKey[] | undefined,
    lens: ScopeLens,
): boolean {
    if (lens.scope === "all") return true;
    return (scopeIds ?? []).includes(lens.scope);
}

export function filterScopeIdsForLens(
    scopeIds: ScopeKey[] | undefined,
    lens: ScopeLens,
): ScopeKey[] {
    if (lens.scope === "all") return scopeIds ?? [];
    return (scopeIds ?? []).filter((scopeId) => scopeId === lens.scope);
}

export function getScopeBound({
    lens,
    surface,
    requested,
}: ScopeBoundOptions): number {
    if (!Number.isFinite(requested) || requested <= 0) return 0;
    if (lens.scope !== "all") return Math.floor(requested);
    return Math.min(Math.floor(requested), SCOPE_ALL_BOUNDS[surface]);
}

export function buildScopeCacheTag(
    readModel: ScopeReadModelKey,
    lens: ScopeLens,
): string {
    return [
        SCOPE_CACHE_TAG_POLICY.namespace,
        SCOPE_CACHE_TAG_POLICY.version,
        readModel,
        lens.scope,
    ].join(":");
}

export function buildLensPrefetchHrefs(lens: ScopeLens): string[] {
    return [
        withLens("/work", lens),
        withLens("/work/tasks", lens),
        withLens("/work/resources", lens),
        withLens("/work/documents", lens),
        withLens("/work/scopes", lens),
    ];
}
