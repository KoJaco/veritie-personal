/**
 * Legacy `@/lib/lens` bridge — maps aspect lens to prior scope-lens API surface.
 * Prefer `@/lib/aspect-lens` for new code.
 */
import {
    ASPECT_DEFINITIONS,
    getAspectLabel,
    isAspectId,
} from "@/lib/aspect/definitions";
import type { AspectId, AspectKey } from "@/lib/domain/aspect";
import {
    aspectIdsMatchLens,
    formatAspectLensLabel,
    getAspectLensFromSearchParams,
    getAspectLensParseResultFromSearchParams,
    normalizeAspectLens,
    parseAspectLens,
    withAspectLens,
    withoutAspectLens,
    mergeParams,
    aspectKeyFromLens,
} from "@/lib/aspect-lens";
import type {
    AspectLens,
    AspectParseResult,
    SearchParamLike,
    SearchParamRecord,
} from "@/lib/aspect-lens";

export type ScopeId = AspectId;
export type ScopeKey = AspectKey;
export type ScopeLens = { scope: ScopeId };

export type { SearchParamRecord };
export type LensParseResult = {
    lens: ScopeLens;
    issues: LensParseIssueCode[];
    inputSizeBytes: number;
};
export type LensParseIssueCode = AspectParseResult["issues"][number] | "INVALID_SCOPE";

export const ENABLE_SCOPE_COLORS = false;
export const LENS_KEYS = ["aspect", "scope", "framework", "mode", "window", "start", "end"] as const;
export const LENS_INPUT_HARD_LIMIT_BYTES = 256;

export type LensWindowPreset = "30d" | "90d" | "180d" | "custom";
export type LegacyLensFramework = "all" | "SOC2" | "E8" | "ISO27001";
export type LegacyLensMode = "TYPE_I" | "TYPE_II";

export type ScopeDefinition = {
    id: ScopeKey;
    label: string;
    shortLabel: string;
    description: string;
};

export const SCOPE_DEFINITIONS: ScopeDefinition[] = ASPECT_DEFINITIONS.map((a) => ({
    id: a.id,
    label: a.label,
    shortLabel: a.shortLabel,
    description: a.description,
}));

export function getScopeDefinition(id: ScopeId): ScopeDefinition | undefined {
    if (id === "all") return undefined;
    return SCOPE_DEFINITIONS.find((s) => s.id === id);
}

export function getScopeLabel(id: ScopeId): string {
    return getAspectLabel(id);
}

export function scopeIdsToLabels(scopeIds: ScopeKey[]): string[] {
    return scopeIds.map((id) => getScopeLabel(id));
}

export function isScopeId(value: string | null | undefined): value is ScopeId {
    return isAspectId(value);
}

export function mapLegacyLensToScope(): ScopeId | null {
    return null;
}

function toScopeLens(lens: AspectLens): ScopeLens {
    return { scope: lens.aspect };
}

export function normalizeLens(input: Partial<ScopeLens> | null | undefined): ScopeLens {
    return toScopeLens(normalizeAspectLens({ aspect: input?.scope }));
}

export function parseLens(searchParams: SearchParamLike | SearchParamRecord): ScopeLens {
    return toScopeLens(parseAspectLens(searchParams));
}

export function getLensFromSearchParams(
    searchParams: SearchParamLike | SearchParamRecord,
): ScopeLens {
    return toScopeLens(getAspectLensFromSearchParams(searchParams));
}

export function getLensParseResultFromSearchParams(
    searchParams: SearchParamLike | SearchParamRecord,
): LensParseResult {
    return parseLensResult(searchParams);
}

export function parseLensResult(
    searchParams: SearchParamLike | SearchParamRecord,
): LensParseResult {
    const result = getAspectLensParseResultFromSearchParams(searchParams);
    return {
        lens: toScopeLens(result.lens),
        issues: result.issues.map((issue) =>
            issue === "INVALID_ASPECT" ? "INVALID_SCOPE" : issue,
        ) as LensParseIssueCode[],
        inputSizeBytes: result.inputSizeBytes,
    };
}

export function serializeLens(lens: ScopeLens): URLSearchParams {
    const params = new URLSearchParams();
    params.set("aspect", normalizeLens(lens).scope);
    return params;
}

export function scopeKeyFromLens(lens: ScopeLens): ScopeKey | null {
    return aspectKeyFromLens({ aspect: lens.scope });
}

export function scopeIdsMatchLens(
    scopeIds: ScopeKey[] | undefined,
    lens: ScopeLens,
): boolean {
    return aspectIdsMatchLens(scopeIds, { aspect: lens.scope });
}

export function filterScopeIdsForLens(
    scopeIds: ScopeKey[] | undefined,
    lens: ScopeLens,
): ScopeKey[] {
    if (!scopeIds) return [];
    if (lens.scope === "all") return scopeIds;
    return scopeIds.filter((id) => id === lens.scope);
}

export function withLens(
    href: string,
    lens: Partial<ScopeLens> | null | undefined,
    extras?: Record<string, string | string[] | null | undefined>,
): string {
    return withAspectLens(href, { aspect: lens?.scope }, extras);
}

export function withoutLens(href: string): string {
    return withoutAspectLens(href);
}

export function formatLensLabel(lens: ScopeLens): string {
    return formatAspectLensLabel({ aspect: lens.scope });
}

export function isSoc2TypeII(): boolean {
    return false;
}

export function stripLensParams(params: URLSearchParams): URLSearchParams {
    const next = new URLSearchParams(params);
    for (const key of LENS_KEYS) next.delete(key);
    return next;
}

export { mergeParams };

export function buildLensPrefetchHrefs(lens: ScopeLens): string[] {
    const normalized = normalizeLens(lens);
    return [
        withLens("/timeline", normalized),
        withLens("/tasks", normalized),
        withLens("/records", normalized),
        withLens("/resources", normalized),
    ];
}

export function scopeBadgeClass(scopeKey: ScopeKey | null): string {
    if (!scopeKey) return "bg-muted text-muted-foreground";
    return "bg-primary/10 text-primary";
}

export { aspectIdsMatchLens } from "@/lib/aspect-lens";
