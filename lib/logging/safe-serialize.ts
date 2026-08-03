/**
 * Safe JSON serialization utilities
 *
 * Provides safe serialization of objects that may contain circular references, functions, or other non-serializable values. Prevents errors when logging complex objects.
 */

/**
 * Safely serializes a value to JSON string
 *
 * Handles:
 * - Circular references (replaced with "[Circular]")
 * - Functions (replaced with "[Function]")
 * - Undefined values (omitted or replaced with null)
 * - Symbols (replaced with "[Symbol]")
 * - BigInt (replaced with "[BigInt]")
 *
 * @param value - The value to serialize
 * @param space - Optional indentation (for pretty printing)
 * @returns JSON string representation
 */
export function safeStringify(value: unknown, space?: number | string): string {
    const seen = new WeakSet();

    function replacer(key: string, val: unknown): unknown {
        // null / undef
        if (val === null || val === undefined) {
            return null;
        }

        switch (typeof val) {
            case "string":
                return val;
            case "number":
                return val;
            case "boolean":
                return val;
            case "function":
                return "[Function]";
            case "symbol":
                return "[Symbol]";
            case "bigint":
                return "[BigInt]";
            case "object":
                // Check for circular references
                if (seen.has(val)) {
                    return "[Circular]";
                }

                // Handle Date objects
                if (val instanceof Date) {
                    return val.toISOString();
                }

                // Handle Error objects
                if (val instanceof Error) {
                    return {
                        name: val.name,
                        message: val.message,
                        stack: val.stack,
                    };
                }

                // Handle RegExp objects
                if (val instanceof RegExp) {
                    return val.toString();
                }

                // Handle Map
                if (val instanceof Map) {
                    return Array.from(val.entries()).reduce((acc, [k, v]) => {
                        acc[String(k)] = v;
                        return acc;
                    }, {} as Record<string, unknown>);
                }

                // Handle Set
                if (val instanceof Set) {
                    return Array.from(val);
                }

                // Mark as seen to detect circular references
                seen.add(val);

                // Handle arrays
                if (Array.isArray(val)) {
                    return val.map((item) => replacer("", item));
                }

                // Handle plain objects
                const result: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(val)) {
                    // Skip private/sensitive fields
                    if (k.startsWith("_") && k.length > 1) {
                        continue;
                    }
                    result[k] = replacer(k, v);
                }
                return result;
            default:
                return val;
        }
    }

    try {
        return JSON.stringify(value, replacer, space);
    } catch (error) {
        // Fallback if serialization still fails
        return `[SerializationError: ${
            error instanceof Error ? error.message : String(error)
        }]`;
    }
}

/**
 * Safely serializes a value for logging
 *
 * Similar to safeStringify but optimized for logging:
 * - Limits depth to prevent excessive output
 * - Limits array/object size
 * - Provides a more compact format
 *
 * @param value - The value to serialize
 * @param maxDepth - Maximum depth to serialize (default: 5)
 * @param maxLength - Maximum array/object size (default: 100)
 * @returns JSON string representation
 */
export function safeStringifyForLogging(
    value: unknown,
    maxDepth: number = 5,
    maxLength: number = 100
): string {
    const seen = new WeakSet();
    let depth = 0;

    function replacer(key: string, val: unknown): unknown {
        // Increment depth
        depth++;

        // Check depth limit
        if (depth > maxDepth) {
            depth--;
            return "[MaxDepth]";
        }

        // Handle null/undefined
        if (val === null || val === undefined) {
            depth--;
            return null;
        }

        switch (typeof val) {
            case "string":
            case "number":
            case "boolean":
                depth--;
                return val;
            case "function":
                depth--;
                return "[Function]";
            case "symbol":
                depth--;
                return "[Symbol]";
            case "bigint":
                depth--;
                return "[BigInt]";
            case "object":
                // Check for circular references
                if (seen.has(val)) {
                    depth--;
                    return "[Circular]";
                }

                // Handle Date objects
                if (val instanceof Date) {
                    depth--;
                    return val.toISOString();
                }

                // Handle Error objects
                if (val instanceof Error) {
                    depth--;
                    return {
                        name: val.name,
                        message: val.message,
                    };
                }

                // Handle RegExp objects
                if (val instanceof RegExp) {
                    depth--;
                    return val.toString();
                }

                // Handle Map
                if (val instanceof Map) {
                    const entries = Array.from(val.entries()).slice(
                        0,
                        maxLength
                    );
                    depth--;
                    return entries.reduce((acc, [k, v]) => {
                        acc[String(k)] = v;
                        return acc;
                    }, {} as Record<string, unknown>);
                }

                // Handle Set
                if (val instanceof Set) {
                    depth--;
                    return Array.from(val).slice(0, maxLength);
                }

                // Mark as seen
                seen.add(val);

                // Handle arrays
                if (Array.isArray(val)) {
                    const limited = val.slice(0, maxLength);
                    const result = limited.map((item) => replacer("", item));
                    if (val.length > maxLength) {
                        result.push(`[${val.length - maxLength} more items]`);
                    }
                    depth--;
                    return result;
                }

                // Handle plain objects
                const entries = Object.entries(val);
                const limited = entries.slice(0, maxLength);
                const result: Record<string, unknown> = {};
                for (const [k, v] of limited) {
                    // Skip private/sensitive fields
                    if (k.startsWith("_") && k.length > 1) {
                        continue;
                    }
                    result[k] = replacer(k, v);
                }
                if (entries.length > maxLength) {
                    result["[more]"] = `[${
                        entries.length - maxLength
                    } more properties]`;
                }
                depth--;
                return result;
            default:
                depth--;
                return val;
        }
    }

    try {
        return JSON.stringify(value, replacer);
    } catch (error) {
        return `[SerializationError: ${
            error instanceof Error ? error.message : String(error)
        }]`;
    }
}
