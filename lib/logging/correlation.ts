/**
 * Request correlation ID utils
 *
 * Provides helpers for creating and reading correlation IDs per request. Helps trace requests across services and logs.
 *
 * In Next.js App Router, use AsyncLocalStorage to maintain correlation context across async operations within a request.
 */

import { AsyncLocalStorage } from "async_hooks";

interface CorrelationContext {
    correlationId: string;
}

// AsyncLocalStorage for maintaining correlation context per request
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Generates a new correlation ID
 *
 * Uses a simple UUID-like format: timestamp-random
 * Example: "1704067200000-a1b2c3d4"
 */
function generateCorrelationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
}

/**
 * Gets the current correlation ID from context
 *
 * Returns undefined if no correlation context is set (e.g., outside a request)
 *
 * @returns The current correlation ID or undefined
 */
export function getCorrelationId(): string | undefined {
    const context = correlationStorage.getStore();
    return context?.correlationId;
}

/**
 * Runs a function with a correlation context
 *
 * Creates a new correlation ID if one doesn't exist, or uses the existing one.
 * This should be called at the start of each request.
 *
 * @param fn - Function to run within the correlation context
 * @param existingId - Optional existing correlation ID to use
 * @returns The result of the function
 */
export function withCorrelationContext<T>(fn: () => T, existingId?: string): T {
    const correlationId = existingId || generateCorrelationId();
    return correlationStorage.run({ correlationId }, fn);
}

/**
 * Creates a new correlation ID
 *
 * Use this when you need to generate a correlation ID outside of a context.
 * For request handling, prefer using `withCorrelationContext` which automatically
 * generates and manages correlation IDs.
 *
 * @returns A new correlation ID
 */
export function createCorrelationId(): string {
    return generateCorrelationId();
}

/**
 * Middleware helper for Next.js App Router
 *
 * Creates a correlation context for the request. This should be used
 * in middleware or at the start of API routes. Prefer start of API routes for now
 *
 * Example:
 * export async function GET() {
 *     return withCorrelationContext(() => {
 *         // middleware logic
 *         return NextResponse.next();
 *     });
 * }
 */
export { withCorrelationContext as withRequestCorrelation };
