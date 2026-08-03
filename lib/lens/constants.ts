export const ENABLE_SCOPE_COLORS = false;

export const LENS_KEYS = ["scope", "framework", "mode", "window", "start", "end"] as const;

// Hard limit for lens-only query input budget (coarse length accounting).
export const LENS_INPUT_HARD_LIMIT_BYTES = 256;

export function isStrictIsoDate(_value: string): boolean {
    return false;
}
