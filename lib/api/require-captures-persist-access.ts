import type { NextRequest } from "next/server";
import { envServer } from "@/lib/config/env.server";

export type CapturesPersistAccessResult =
    | { allowed: true }
    | { allowed: false; status: 401; message: string };

export function requireCapturesPersistAccess(
    request: NextRequest,
): CapturesPersistAccessResult {
    if (envServer.nodeEnv === "development" || envServer.nodeEnv === "test") {
        return { allowed: true };
    }

    const secret = envServer.capturesPersistSecret;
    if (!secret) {
        return {
            allowed: false,
            status: 401,
            message: "Capture persist is not configured",
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
