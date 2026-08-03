import { ASPECT_LENS_KEYS } from "./constants";
import type { AspectId, AspectKey } from "@/lib/domain/aspect";

export type { AspectId, AspectKey };

export type SearchParamLike =
    | URLSearchParams
    | { get: (key: string) => string | null };

export type SearchParamRecord = Record<string, string | string[] | undefined>;

export type AspectLens = {
    aspect: AspectId;
};

export type AspectParseIssueCode =
    | "OVERSIZED_INPUT"
    | "INVALID_ASPECT"
    | "LEGACY_SCOPE_KEY";

export type AspectParseResult = {
    lens: AspectLens;
    issues: AspectParseIssueCode[];
    inputSizeBytes: number;
};

export type AspectTagKey = AspectKey;

export type AspectLensKey = (typeof ASPECT_LENS_KEYS)[number];
