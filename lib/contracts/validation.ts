export const PAYLOAD_SOFT_LIMIT_BYTES = 24_576;
export const PAYLOAD_HARD_LIMIT_BYTES = 32_768;

export type ValidationErrorCode =
    | "UNKNOWN_TOP_LEVEL_KEY"
    | "NON_JSON_SAFE_VALUE"
    | "INVALID_SHAPE"
    | "HARD_LIMIT_EXCEEDED"
    | "SERIALIZATION_FAILED";

export type ValidationResult<T> =
    | {
          ok: true;
          value: T;
          sizeBytes: number;
          reason?: string;
      }
    | {
          ok: false;
          errorCode: ValidationErrorCode;
          reason: string;
          sizeBytes?: number;
      };

export function isPlainObject(
    value: unknown,
): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

export function getUnknownKeys(
    input: Record<string, unknown>,
    allowedKeys: readonly string[],
): string[] {
    const allowlist = new Set(allowedKeys);
    return Object.keys(input).filter((key) => !allowlist.has(key));
}

export function validateJsonSafe(value: unknown): ValidationResult<unknown> {
    const seen = new WeakSet<object>();

    function walk(candidate: unknown, path: string): ValidationResult<unknown> {
        if (candidate === null) {
            return { ok: true, value: null, sizeBytes: 0 };
        }

        const valueType = typeof candidate;

        if (valueType === "string" || valueType === "boolean") {
            return { ok: true, value: candidate, sizeBytes: 0 };
        }

        if (valueType === "number") {
            if (Number.isFinite(candidate)) {
                return { ok: true, value: candidate, sizeBytes: 0 };
            }

            return {
                ok: false,
                errorCode: "NON_JSON_SAFE_VALUE",
                reason: `Non-finite number at ${path}`,
            };
        }

        if (
            valueType === "undefined" ||
            valueType === "function" ||
            valueType === "symbol" ||
            valueType === "bigint"
        ) {
            return {
                ok: false,
                errorCode: "NON_JSON_SAFE_VALUE",
                reason: `Unsupported type "${valueType}" at ${path}`,
            };
        }

        if (valueType !== "object" || candidate === null) {
            return {
                ok: false,
                errorCode: "NON_JSON_SAFE_VALUE",
                reason: `Unsupported value at ${path}`,
            };
        }

        const objectCandidate = candidate as object;

        if (seen.has(objectCandidate)) {
            return {
                ok: false,
                errorCode: "SERIALIZATION_FAILED",
                reason: `Circular reference detected at ${path}`,
            };
        }

        seen.add(objectCandidate);

        if (Array.isArray(candidate)) {
            for (let index = 0; index < candidate.length; index += 1) {
                const nested = walk(candidate[index], `${path}[${index}]`);
                if (!nested.ok) {
                    return nested;
                }
            }
            return { ok: true, value: candidate, sizeBytes: 0 };
        }

        if (!isPlainObject(candidate)) {
            return {
                ok: false,
                errorCode: "NON_JSON_SAFE_VALUE",
                reason: `Non-plain object at ${path}`,
            };
        }

        for (const [key, nestedValue] of Object.entries(candidate)) {
            const nested = walk(nestedValue, `${path}.${key}`);
            if (!nested.ok) {
                return nested;
            }
        }

        return { ok: true, value: candidate, sizeBytes: 0 };
    }

    return walk(value, "root");
}

export function serializeAndMeasure(value: unknown): ValidationResult<string> {
    try {
        const serialized = JSON.stringify(value);
        if (serialized === undefined) {
            return {
                ok: false,
                errorCode: "SERIALIZATION_FAILED",
                reason: "JSON.stringify returned undefined",
            };
        }

        return {
            ok: true,
            value: serialized,
            sizeBytes: serialized.length,
        };
    } catch (error) {
        return {
            ok: false,
            errorCode: "SERIALIZATION_FAILED",
            reason: `Failed to serialize payload: ${String(error)}`,
        };
    }
}
