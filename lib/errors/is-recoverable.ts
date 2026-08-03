/**
 * Is the Error recoverable?
 *
 * Determines whether an error is likely recoverable (user can retry) vs
 * requiring support intervention. Should guide UX, not be a hard rule..
 */

import { normalizeError } from "./normalize";

/**
 * Determines if an error is likely recoverable through user retry
 *
 * Recoverable errors:
 * - Network errors (timeouts, connection failures)
 * - 5xx server errors (temporary server issues)
 * - Rate limiting (429)
 * - Temporary service unavailability
 *
 * Non-recoverable errors:
 * - 4xx client errors (bad request, unauthorized, not found)
 * - Validation errors
 * - Authentication/authorization failures
 * - Malformed requests
 *
 * @param error - The error to check (will be normalized first)
 * @returns true if the error is likely recoverable, false otherwise
 */
export function isRecoverableError(error: unknown): boolean {
    const normalized = normalizeError(error);

    if (normalized.code) {
        const code = normalized.code.toLowerCase();

        // network-related codes
        if (
            code === "econnrefused" ||
            code === "etimedout" ||
            code === "enotfound" ||
            code === "econnreset"
        ) {
            return true;
        }

        // http status codes
        const statusCode = parseInt(code, 10);
        if (!isNaN(statusCode)) {
            // 5xx errors are generally recoverable (server issues like timeouts, etc)
            if (statusCode >= 500 && statusCode < 600) {
                return true;
            }

            // 429 (Too Many Requests) is recoverable after backoff (rate limiting)
            if (statusCode === 429) {
                return true;
            }

            // 4xx errors are generally not recoverable (client issues like bad request, unauthorized, etc)
            if (statusCode >= 400 && statusCode < 500) {
                return false;
            }
        }
    }

    // check error name
    const name = normalized.name.toLowerCase();
    if (
        name.includes("network") ||
        name.includes("timeout") ||
        name.includes("connection") ||
        name.includes("fetch")
    ) {
        return true;
    }

    // check error message for common recoverable patterns
    const message = normalized.message.toLowerCase();
    if (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("connection") ||
        message.includes("temporary") ||
        message.includes("service unavailable") ||
        message.includes("try again")
    ) {
        return true;
    }

    // check error message for non-recoverable patterns
    if (
        message.includes("not found") ||
        message.includes("unauthorized") ||
        message.includes("forbidden") ||
        message.includes("bad request") ||
        message.includes("validation") ||
        message.includes("invalid")
    ) {
        return false;
    }

    // Default to non-recoverable (safer... gotta not allow retries on unknown errors)
    return false;
}
