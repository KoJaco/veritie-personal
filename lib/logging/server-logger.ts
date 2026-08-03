/**
 * Server-side logger
 *
 * Provides consistent logging primitives for server-side code (API routes,
 * Server Components, Server Actions). Debug logs are only enabled in development.
 */

import { envServer } from "@/lib/config/env.server";
import { safeStringifyForLogging } from "./safe-serialize";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    [key: string]: unknown;
}

const isDevelopment = envServer.nodeEnv === "development";

/**
 * Formats a log message with optional context
 */
function formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    let formatted = `[${timestamp}] ${levelUpper} ${message}`;

    if (context && Object.keys(context).length > 0) {
        try {
            const contextStr = safeStringifyForLogging(context);
            formatted += ` ${contextStr}`;
        } catch (error) {
            // Fallback if context can't be serialized
            formatted += ` [context serialization failed]. Error message: ${error}`;
        }
    }

    return formatted;
}

/**
 * Server-side logger with environment-gated verbosity
 *
 * Usage:
 * import { logger } from "@/lib/logging/server-logger";
 *
 * logger.debug("Debug message", { userId: "123" });
 * logger.info("Info message", { action: "user.login" });
 * logger.warn("Warning message", { threshold: 90 });
 * logger.error("Error message", { error: errorObject });
 */
export const logger = {
    /**
     * Debug-level logging - dev only
     */
    debug(message: string, context?: LogContext): void {
        if (!isDevelopment) {
            return;
        }

        const formatted = formatMessage("debug", message, context);
        console.debug(formatted);
    },

    /**
     * Info-level logging - always on
     */
    info(message: string, context?: LogContext): void {
        const formatted = formatMessage("info", message, context);
        console.info(formatted);
    },

    /**
     * Warning-level logging - always on
     */
    warn(message: string, context?: LogContext): void {
        const formatted = formatMessage("warn", message, context);
        console.warn(formatted);
    },

    /**
     * Error-level logging - always on
     */
    error(message: string, context?: LogContext): void {
        const formatted = formatMessage("error", message, context);
        console.error(formatted);
    },
} as const;
