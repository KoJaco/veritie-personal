import { LENS_INPUT_HARD_LIMIT_BYTES, LENS_KEYS } from "./constants";
import {
    type ScopeKey,
    type LegacyLensInput,
    type LensParseIssueCode,
    type LensParseResult,
    type ScopeId,
    type ScopeLens,
    type SearchParamLike,
    type SearchParamRecord,
} from "./types";
import {
    getScopeLabel,
    isScopeId,
    mapLegacyLensToScope,
} from "./scope-definitions";

function readParam(
    searchParams: SearchParamLike | SearchParamRecord | null | undefined,
    key: string,
): string | null {
    if (!searchParams) return null;

    if ("get" in searchParams && typeof searchParams.get === "function") {
        return searchParams.get(key) ?? null;
    }

    const value = (searchParams as SearchParamRecord)[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
}

function countLensInputSizeBytes(
    valuesByKey: Record<string, string | null>,
): number {
    let sizeBytes = 0;
    let pairCount = 0;

    for (const [key, value] of Object.entries(valuesByKey)) {
        if (!value) continue;
        sizeBytes += key.length + 1 + value.length;
        if (pairCount > 0) sizeBytes += 1;
        pairCount += 1;

        if (sizeBytes > LENS_INPUT_HARD_LIMIT_BYTES) {
            return sizeBytes;
        }
    }

    return sizeBytes;
}

function toLens(scope: ScopeId): ScopeLens {
    return { scope };
}

export function scopeKeyFromLens(
    lens: ScopeLens,
): ScopeKey | null {
    return lens.scope === "all" ? null : lens.scope;
}

export function normalizeLens(
    input: Partial<ScopeLens | LegacyLensInput> | null | undefined,
): ScopeLens {
    const legacyInput = input as Partial<LegacyLensInput> | null | undefined;
    const legacyMapped = mapLegacyLensToScope(
        legacyInput?.framework,
        legacyInput?.mode,
    );
    const candidate = input?.scope ?? legacyMapped ?? "all";
    const scope: ScopeId = isScopeId(candidate) ? candidate : "all";
    return toLens(scope);
}

export function parseLensResult(
    searchParams: SearchParamLike | SearchParamRecord,
): LensParseResult {
    const issues: LensParseIssueCode[] = [];

    const scopeRaw = readParam(searchParams, "scope");
    const frameworkRaw = readParam(searchParams, "framework");
    const modeRaw = readParam(searchParams, "mode");

    const inputSizeBytes = countLensInputSizeBytes({
        scope: scopeRaw,
        framework: frameworkRaw,
        mode: modeRaw,
    });

    if (inputSizeBytes > LENS_INPUT_HARD_LIMIT_BYTES) {
        return {
            lens: toLens("all"),
            issues: ["OVERSIZED_INPUT"],
            inputSizeBytes,
        };
    }

    if (scopeRaw !== null) {
        if (isScopeId(scopeRaw)) {
            return {
                lens: normalizeLens({ scope: scopeRaw }),
                issues,
                inputSizeBytes,
            };
        }

        return {
            lens: toLens("all"),
            issues: ["INVALID_SCOPE"],
            inputSizeBytes,
        };
    }

    const legacyScope = mapLegacyLensToScope(frameworkRaw, modeRaw);
    if (legacyScope) {
        return {
            lens: normalizeLens({ scope: legacyScope }),
            issues: frameworkRaw && frameworkRaw !== "all" ? ["INVALID_FRAMEWORK"] : [],
            inputSizeBytes,
        };
    }

    return {
        lens: toLens("all"),
        issues: frameworkRaw ? ["INVALID_FRAMEWORK"] : [],
        inputSizeBytes,
    };
}

export function parseLens(
    searchParams: SearchParamLike | SearchParamRecord,
): ScopeLens {
    return parseLensResult(searchParams).lens;
}

export function getLensFromSearchParams(
    searchParams: SearchParamLike | SearchParamRecord,
): ScopeLens {
    return parseLens(searchParams);
}

export function getLensParseResultFromSearchParams(
    searchParams: SearchParamLike | SearchParamRecord,
): LensParseResult {
    return parseLensResult(searchParams);
}

export function serializeLens(lens: ScopeLens): URLSearchParams {
    const normalized = normalizeLens(lens);
    const params = new URLSearchParams();
    params.set("scope", normalized.scope);
    return params;
}

export function isSoc2TypeII(lens: ScopeLens): boolean {
    return lens.scope === "delivery-observability";
}

export function stripLensParams(params: URLSearchParams): URLSearchParams {
    const next = new URLSearchParams(params);
    for (const key of LENS_KEYS) next.delete(key);
    return next;
}

export function mergeParams(
    params: URLSearchParams,
    extras: Record<string, string | string[] | null | undefined>,
): URLSearchParams {
    const next = new URLSearchParams(params);

    for (const [key, value] of Object.entries(extras)) {
        if (value === undefined || value === null) {
            next.delete(key);
            continue;
        }
        if (Array.isArray(value)) {
            next.delete(key);
            for (const v of value) next.append(key, v);
            continue;
        }
        next.set(key, value);
    }

    return next;
}

export function withLens(
    href: string,
    lens: Partial<ScopeLens | LegacyLensInput> | null | undefined,
    extras?: Record<string, string | string[] | null | undefined>,
): string {
    const normalizedLens = normalizeLens(lens ?? { scope: "all" });

    const isAbsolute = /^https?:\/\//i.test(href);
    const base = isAbsolute
        ? href
        : `http://local${href.startsWith("/") ? "" : "/"}${href}`;

    const url = new URL(base);
    const withoutLens = stripLensParams(url.searchParams);
    const lensParams = serializeLens(normalizedLens);
    lensParams.forEach((value, key) => withoutLens.set(key, value));

    const finalParams = extras ? mergeParams(withoutLens, extras) : withoutLens;
    url.search = finalParams.toString();

    if (isAbsolute) return url.toString();

    return `${url.pathname}${url.search ? url.search : ""}`;
}

export function withoutLens(href: string): string {
    const isAbsolute = /^https?:\/\//i.test(href);
    const base = isAbsolute
        ? href
        : `http://local${href.startsWith("/") ? "" : "/"}${href}`;

    const url = new URL(base);
    url.search = stripLensParams(url.searchParams).toString();

    if (isAbsolute) return url.toString();
    return `${url.pathname}${url.search ? url.search : ""}`;
}

export function formatLensLabel(lens: ScopeLens): string {
    return getScopeLabel(lens.scope);
}
