import type { ErrorResponse } from "./types";

const SHOW_SDK_DEBUG_LOGS =
    typeof process === "undefined" || process.env.NODE_ENV !== "production";

export class VeritieSDKError extends Error {
    readonly code: string;
    readonly status?: number;
    readonly details?: unknown;
    readonly cause?: unknown;

    constructor(args: {
        code: string;
        message: string;
        status?: number;
        details?: unknown;
        cause?: unknown;
    }) {
        super(args.message);
        this.name = "VeritieSDKError";
        this.code = args.code;
        this.status = args.status;
        this.details = args.details;
        this.cause = args.cause;
    }
}

export function normalizeThrownError(
    error: unknown,
    fallback = "unknown_error",
): VeritieSDKError {
    if (error instanceof VeritieSDKError) {
        logSDKDebug("warn", "[veritie-sdk] normalizeThrownError received SDK error", {
            fallback,
            error: describeUnknownError(error),
        });
        return error;
    }
    if (error instanceof Error) {
        logSDKDebug("error", "[veritie-sdk] normalizing thrown error", {
            fallback,
            error: describeUnknownError(error),
        });
        return new VeritieSDKError({
            code: fallback,
            message: error.message,
            cause: error,
        });
    }
    logSDKDebug("error", "[veritie-sdk] normalizing non-Error throw", {
        fallback,
        error: describeUnknownError(error),
    });
    return new VeritieSDKError({
        code: fallback,
        message: "An unknown error occurred",
        cause: error,
    });
}

export function errorFromResponse(
    status: number,
    payload?: Partial<ErrorResponse>,
    fallbackMessage?: string,
): VeritieSDKError {
    return new VeritieSDKError({
        code: payload?.error ?? "http_error",
        message:
            payload?.message ??
            fallbackMessage ??
            `Request failed with status ${status}`,
        status,
        details: payload?.details,
    });
}

export function describeUnknownError(
    error: unknown,
): Record<string, unknown> | null {
    if (error instanceof VeritieSDKError) {
        return {
            name: error.name,
            message: error.message,
            code: error.code,
            status: error.status ?? null,
            details: error.details ?? null,
            cause: describeUnknownError(error.cause),
        };
    }

    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack ?? null,
        };
    }

    return {
        value: error ?? null,
        type: typeof error,
    };
}

function logSDKDebug(
    level: "warn" | "error",
    message: string,
    details: Record<string, unknown>,
) {
    if (!SHOW_SDK_DEBUG_LOGS) {
        return;
    }

    console[level](message, details);
}
