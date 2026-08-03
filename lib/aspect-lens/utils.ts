import { ASPECT_LENS_KEYS, ASPECT_INPUT_HARD_LIMIT_BYTES } from "./constants";
import {
    getAspectLabel,
    isAspectId,
} from "@/lib/aspect/definitions";
import type {
    AspectId,
    AspectKey,
    AspectLens,
    AspectParseIssueCode,
    AspectParseResult,
    SearchParamLike,
    SearchParamRecord,
} from "./types";

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

function countInputSizeBytes(valuesByKey: Record<string, string | null>): number {
    let sizeBytes = 0;
    let pairCount = 0;

    for (const [key, value] of Object.entries(valuesByKey)) {
        if (!value) continue;
        sizeBytes += key.length + 1 + value.length;
        if (pairCount > 0) sizeBytes += 1;
        pairCount += 1;
        if (sizeBytes > ASPECT_INPUT_HARD_LIMIT_BYTES) return sizeBytes;
    }

    return sizeBytes;
}

function toLens(aspect: AspectId): AspectLens {
    return { aspect };
}

export function aspectKeyFromLens(lens: AspectLens): AspectKey | null {
    return lens.aspect === "all" ? null : lens.aspect;
}

export function normalizeAspectLens(
    input: Partial<AspectLens> | null | undefined,
): AspectLens {
    const candidate = input?.aspect ?? "all";
    const aspect: AspectId = isAspectId(candidate) ? candidate : "all";
    return toLens(aspect);
}

export function parseAspectLensResult(
    searchParams: SearchParamLike | SearchParamRecord,
): AspectParseResult {
    const issues: AspectParseIssueCode[] = [];

    const aspectRaw = readParam(searchParams, "aspect");
    const scopeRaw = readParam(searchParams, "scope");

    const inputSizeBytes = countInputSizeBytes({
        aspect: aspectRaw,
        scope: scopeRaw,
    });

    if (inputSizeBytes > ASPECT_INPUT_HARD_LIMIT_BYTES) {
        return {
            lens: toLens("all"),
            issues: ["OVERSIZED_INPUT"],
            inputSizeBytes,
        };
    }

    if (aspectRaw !== null) {
        if (isAspectId(aspectRaw)) {
            return {
                lens: normalizeAspectLens({ aspect: aspectRaw }),
                issues,
                inputSizeBytes,
            };
        }
        return {
            lens: toLens("all"),
            issues: ["INVALID_ASPECT"],
            inputSizeBytes,
        };
    }

    if (scopeRaw !== null) {
        issues.push("LEGACY_SCOPE_KEY");
    }

    return {
        lens: toLens("all"),
        issues: scopeRaw && !isAspectId(scopeRaw) ? ["INVALID_ASPECT"] : issues,
        inputSizeBytes,
    };
}

export function parseAspectLens(
    searchParams: SearchParamLike | SearchParamRecord,
): AspectLens {
    return parseAspectLensResult(searchParams).lens;
}

export function getAspectLensFromSearchParams(
    searchParams: SearchParamLike | SearchParamRecord,
): AspectLens {
    return parseAspectLens(searchParams);
}

export function getAspectLensParseResultFromSearchParams(
    searchParams: SearchParamLike | SearchParamRecord,
): AspectParseResult {
    return parseAspectLensResult(searchParams);
}

export function serializeAspectLens(lens: AspectLens): URLSearchParams {
    const normalized = normalizeAspectLens(lens);
    const params = new URLSearchParams();
    params.set("aspect", normalized.aspect);
    return params;
}

export function stripAspectLensParams(params: URLSearchParams): URLSearchParams {
    const next = new URLSearchParams(params);
    for (const key of ASPECT_LENS_KEYS) next.delete(key);
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

export function withAspectLens(
    href: string,
    lens: Partial<AspectLens> | null | undefined,
    extras?: Record<string, string | string[] | null | undefined>,
): string {
    const normalizedLens = normalizeAspectLens(lens ?? { aspect: "all" });

    const isAbsolute = /^https?:\/\//i.test(href);
    const base = isAbsolute
        ? href
        : `http://local${href.startsWith("/") ? "" : "/"}${href}`;

    const url = new URL(base);
    const withoutLens = stripAspectLensParams(url.searchParams);
    const lensParams = serializeAspectLens(normalizedLens);
    lensParams.forEach((value, key) => withoutLens.set(key, value));

    const finalParams = extras ? mergeParams(withoutLens, extras) : withoutLens;
    url.search = finalParams.toString();

    if (isAbsolute) return url.toString();
    return `${url.pathname}${url.search ? url.search : ""}`;
}

export function withoutAspectLens(href: string): string {
    const isAbsolute = /^https?:\/\//i.test(href);
    const base = isAbsolute
        ? href
        : `http://local${href.startsWith("/") ? "" : "/"}${href}`;

    const url = new URL(base);
    url.search = stripAspectLensParams(url.searchParams).toString();

    if (isAbsolute) return url.toString();
    return `${url.pathname}${url.search ? url.search : ""}`;
}

export function formatAspectLensLabel(lens: AspectLens): string {
    return getAspectLabel(lens.aspect);
}

export function aspectIdsMatchLens(
    aspectIds: AspectKey[] | undefined,
    lens: AspectLens,
): boolean {
    if (lens.aspect === "all") return true;
    if (!aspectIds || aspectIds.length === 0) return false;
    return aspectIds.includes(lens.aspect);
}
