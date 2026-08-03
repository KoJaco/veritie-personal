import type { NextRequest } from "next/server";
import { envServer } from "@/lib/config/env.server";

export type InternalStubApiAccessResult =
    | { allowed: true }
    | { allowed: false; status: 401; message: string };

/**
 * Bearer gate for programmatic stub mutation APIs (scripts, admin).
 * Browser flows should use server actions instead of exposing this secret client-side.
 */
export function requireInternalStubApiAccess(
    request: NextRequest,
): InternalStubApiAccessResult {
    if (envServer.nodeEnv === "development" || envServer.nodeEnv === "test") {
        return { allowed: true };
    }

    const secret = envServer.capturesPersistSecret;
    if (!secret) {
        return {
            allowed: false,
            status: 401,
            message: "Stub API is not configured",
        };
    }

    const authHeader = request.headers.get("authorization");
    const expected = `Bearer ${secret}`;
    if (authHeader !== expected) {
        return {
            allowed: false,
            status: 401,
            message: "Unauthorized",
        };
    }

    return { allowed: true };
}
