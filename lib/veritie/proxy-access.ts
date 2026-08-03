import type { NextRequest } from "next/server";
import { envServer } from "@/lib/config/env.server";

export type VeritieProxyAccessResult =
    | { allowed: true }
    | { allowed: false; status: 403; message: string };

/**
 * Interim same-origin gate until session auth lands on capture routes.
 * Browser SDK calls should be same-origin; rejects cross-site fetches with cookies.
 */
export function assertVeritieProxyAccess(
    request: NextRequest,
): VeritieProxyAccessResult {
    if (envServer.nodeEnv === "development" || envServer.nodeEnv === "test") {
        return { allowed: true };
    }

    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite && secFetchSite !== "same-origin") {
        return {
            allowed: false,
            status: 403,
            message: "Cross-site Veritie proxy requests are not allowed",
        };
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
        try {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return {
                    allowed: false,
                    status: 403,
                    message: "Origin does not match host",
                };
            }
        } catch {
            return {
                allowed: false,
                status: 403,
                message: "Invalid origin header",
            };
        }
    }

    return { allowed: true };
}
