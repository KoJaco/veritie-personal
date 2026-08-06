import type { AccountScope } from "@/lib/db/repositories/context";
import { registerVeritieJobLease } from "@/lib/db/repositories/veritie-job-leases";
import { logger } from "@/lib/logging/server-logger";

const JOB_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export function injectVeritieJobMetadata(
    body: string,
    scope: AccountScope,
): string {
    try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        const metadata =
            typeof parsed.metadata === "object" && parsed.metadata !== null
                ? (parsed.metadata as Record<string, unknown>)
                : {};

        parsed.metadata = {
            ...metadata,
            account_id: scope.accountId,
            user_id: scope.userId,
        };

        return JSON.stringify(parsed);
    } catch {
        return body;
    }
}

export async function registerVeritieJobLeaseFromProxyResponse(
    scope: AccountScope,
    pathSegments: string[],
    upstreamStatus: number,
    upstreamBody: string,
): Promise<void> {
    if (
        pathSegments.length !== 1 ||
        pathSegments[0] !== "jobs" ||
        upstreamStatus < 200 ||
        upstreamStatus >= 300
    ) {
        return;
    }

    try {
        const payload = JSON.parse(upstreamBody) as { job_id?: unknown };
        const jobId = payload.job_id;

        if (typeof jobId !== "string" || !JOB_ID_PATTERN.test(jobId)) {
            return;
        }

        await registerVeritieJobLease(scope, jobId);
    } catch (error) {
        logger.error("[veritie-proxy] lease_registration_failed", {
            error: error instanceof Error ? error : String(error),
        });
    }
}
