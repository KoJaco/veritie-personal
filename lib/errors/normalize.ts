/**
 * Error normalization utils
 *
 * Goal:
 * 1) normalize unknown errors into a safe, predictable shape for error boundaries and logging.
 * 2) Ensures we can safely handle any error type without leaking sensitive data or causing additional errors.
 */

export interface NormalizedError {
    name: string;
    message: string;
    code?: string;
    cause?: unknown;
    stack?: string;
}

/**
 * Normalizes an unknown error into a safe shape
 *
 * Handles:
 * - Error instances
 * - String errors
 * - Object errors
 * - null/undefined
 * - Circular references
 *
 * @param error - The unknown error to normalize
 * @param includeStack - Whether to include stack trace (gated by env with default as false)
 * @returns A normalized error obj
 */
export function normalizeError(
    error: unknown,
    includeStack: boolean = false
): NormalizedError {
    // null / undef
    if (error == null) {
        return {
            name: "UnknownError",
            message: "An unknown error occurred",
        };
    }

    // instance of Error type
    if (error instanceof Error) {
        return {
            name: error.name || "Error",
            message: error.message || "An error occurred",
            code: getErrorCode(error),
            cause: error.cause,
            stack: includeStack ? error.stack : undefined,
        };
    }

    // string
    if (typeof error === "string") {
        return {
            name: "StringError",
            message: error,
        };
    }

    // object
    if (typeof error === "object") {
        const errorObj = error as Record<string, unknown>;
        return {
            name: getStringProperty(errorObj, "name") || "ObjectError",
            message:
                getStringProperty(errorObj, "message") ||
                getStringProperty(errorObj, "error") ||
                String(errorObj) ||
                "An error occurred",
            code: getStringProperty(errorObj, "code"),
            cause: errorObj.cause,
            stack: includeStack
                ? getStringProperty(errorObj, "stack")
                : undefined,
        };
    }

    // fallback for primitives
    return {
        name: typeof error,
        message: String(error),
    };
}

/**
 * Safely extracts a string property from an object
 */
function getStringProperty(
    obj: Record<string, unknown>,
    key: string
): string | undefined {
    const value = obj[key];
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return undefined;
}

/**
 * Attempts to extract an error code from an Error instance
 *
 * Checks common properties where error codes might be stored:
 * - error.code (string or number)
 * - error.statusCode (number)
 * - error.status (number)
 */
function getErrorCode(error: Error): string | undefined {
    const errorWithCode = error as Error & {
        code?: string | number;
        statusCode?: number;
        status?: number;
    };

    if (errorWithCode.code !== undefined) {
        return String(errorWithCode.code);
    }
    if (errorWithCode.statusCode !== undefined) {
        return String(errorWithCode.statusCode);
    }
    if (errorWithCode.status !== undefined) {
        return String(errorWithCode.status);
    }

    return undefined;
}
