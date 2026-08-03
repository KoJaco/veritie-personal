/**
 * Client-side logger
 *
 * Provides consistent logging primitives for client-side code (React components,
 * client-side hooks, browser code). Debug and info logs are gated in production
 * builds to reduce noise and improve performance.
 */

"use client";

import { envPublic } from "@/lib/config/env.public";
import { safeStringifyForLogging } from "./safe-serialize";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    [key: string]: unknown;
}

const isDevelopment =
    process.env.NODE_ENV === "development" || envPublic.appEnv === "local";

/**
 * Determines if a log level should be output based on environment
 */
function shouldLog(level: LogLevel): boolean {
    // In production, only warn and error are logged
    if (!isDevelopment) {
        return level === "warn" || level === "error";
    }

    // In development, all levels are logged
    return true;
}

/**
 * Formats a log message with optional context
 */
function formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
): void {
    if (!shouldLog(level)) {
        return;
    }

    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const prefix = `[${timestamp}] ${levelUpper}`;

    const logMessage = `${prefix} ${message}`;

    if (context && Object.keys(context).length > 0) {
        try {
            const contextStr = safeStringifyForLogging(context);

            // Only try to parse if we have a valid JSON string
            if (contextStr && contextStr.trim() !== "") {
                try {
                    const contextObj = JSON.parse(contextStr);

                    // Use console methods with structured logging
                    // Pass as separate arguments for better browser console formatting
                    switch (level) {
                        case "debug":
                            console.debug(logMessage, contextObj);
                            break;
                        case "info":
                            console.info(logMessage, contextObj);
                            break;
                        case "warn":
                            console.warn(logMessage, contextObj);
                            break;
                        case "error":
                            console.error(logMessage, contextObj);
                            break;
                    }
                    return;
                    // eslint-disable-next-line
                } catch (_parseError) {
                    // parseError intentionally unused
                    // If parsing fails, fall through to string logging
                }
            }

            // Fallback to string logging
            switch (level) {
                case "debug":
                    console.debug(logMessage, contextStr);
                    break;
                case "info":
                    console.info(logMessage, contextStr);
                    break;
                case "warn":
                    console.warn(logMessage, contextStr);
                    break;
                case "error":
                    console.error(logMessage, contextStr);
                    break;
            }
            // eslint-disable-next-line
        } catch (error) {
            // Final fallback - log without context if everything fails
            switch (level) {
                case "debug":
                    console.debug(logMessage);
                    break;
                case "info":
                    console.info(logMessage);
                    break;
                case "warn":
                    console.warn(logMessage);
                    break;
                case "error":
                    console.error(logMessage);
                    break;
            }
        }
    } else {
        // No context, just log the message
        switch (level) {
            case "debug":
                console.debug(logMessage);
                break;
            case "info":
                console.info(logMessage);
                break;
            case "warn":
                console.warn(logMessage);
                break;
            case "error":
                console.error(logMessage);
                break;
        }
    }
}

/**
 * Client-side logger with environment-gated verbosity
 *
 * Usage:
 * import { logger } from "@/lib/logging/client-logger";
 *
 * logger.debug("Debug message", { userId: "123" });
 * logger.info("Info message", { action: "user.login" });
 * logger.warn("Warning message", { threshold: 90 });
 * logger.error("Error message", { error: errorObject });
 *
 * In production builds:
 * - debug() and info() are no-ops (no output)
 * - warn() and error() are always logged
 *
 * In development:
 * - All log levels are output
 */
export const logger = {
    /**
     * Debug-level logging
     * Only enabled in development mode
     */
    debug(message: string, context?: LogContext): void {
        formatMessage("debug", message, context);
    },

    /**
     * Info-level logging
     * Only enabled in development mode
     */
    info(message: string, context?: LogContext): void {
        formatMessage("info", message, context);
    },

    /**
     * Warning-level logging
     * Always enabled (even in production)
     */
    warn(message: string, context?: LogContext): void {
        formatMessage("warn", message, context);
    },

    /**
     * Error-level logging
     * Always enabled (even in production)
     */
    error(message: string, context?: LogContext): void {
        formatMessage("error", message, context);
    },
} as const;
