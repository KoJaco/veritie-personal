import { aspectIdsMatchLens } from "@/lib/aspect-lens";
import type { AspectId, AspectKey } from "@/lib/domain/aspect";

export type ScopeId = AspectId;
export type ScopeKey = AspectKey;
export type ScopeLens = { scope: ScopeId };

export function scopeIdsMatchLens(
    scopeIds: ScopeKey[] | undefined,
    lens: ScopeLens,
): boolean {
    return aspectIdsMatchLens(scopeIds, { aspect: lens.scope });
}

export function scopeIdsToLabels(scopeIds: ScopeKey[]): string[] {
    return scopeIds;
}

export function isUnmappedScope(scopeIds: ScopeKey[] | undefined): boolean {
    return !scopeIds || scopeIds.length === 0;
}

export function getPrimaryScopeId(
    scopeIds: ScopeKey[] | undefined,
): ScopeKey | "UNMAPPED" {
    if (!scopeIds || scopeIds.length === 0) return "UNMAPPED";
    return scopeIds[0];
}
