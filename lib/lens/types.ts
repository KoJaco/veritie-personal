import { LENS_KEYS } from "./constants";

export type ScopeId =
    | "all"
    | "operations-readiness"
    | "delivery-observability"
    | "workspace-resilience"
    | "knowledge-hygiene";

export type ScopeKey = Exclude<ScopeId, "all">;

export type LegacyLensFramework = "all" | "SOC2" | "E8" | "ISO27001";
export type LegacyLensMode = "TYPE_I" | "TYPE_II";
export type LensWindowPreset = "30d" | "90d" | "180d" | "custom";

export type SearchParamLike =
    | URLSearchParams
    | { get: (key: string) => string | null };

export type SearchParamRecord = Record<string, string | string[] | undefined>;

export type ScopeLens = {
    scope: ScopeId;
};

export type LegacyLensInput = {
    scope?: ScopeId | string;
    framework: LegacyLensFramework;
    mode?: LegacyLensMode;
    window?: LensWindowPreset;
    start?: string;
    end?: string;
};

export type LensParseIssueCode =
    | "OVERSIZED_INPUT"
    | "INVALID_SCOPE"
    | "INVALID_FRAMEWORK";

export type LensParseResult = {
    lens: ScopeLens;
    issues: LensParseIssueCode[];
    inputSizeBytes: number;
};

export type ScopeTagKey = ScopeKey;

export type LensKey = (typeof LENS_KEYS)[number];
