import type { VeritieProxyMethod } from "./proxy-request";

const JOB_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

/**
 * Returns the Veritie job id for job-scoped proxy paths, or null for job creation.
 * Job-scoped: GET jobs/:id, POST jobs/:id/upload-finalize
 */
export function extractVeritieJobIdFromProxyPath(
    method: VeritieProxyMethod,
    pathSegments: string[],
): string | null {
    if (
        method === "GET" &&
        pathSegments.length === 2 &&
        pathSegments[0] === "jobs" &&
        JOB_ID_PATTERN.test(pathSegments[1])
    ) {
        return pathSegments[1];
    }

    if (
        method === "POST" &&
        pathSegments.length === 3 &&
        pathSegments[0] === "jobs" &&
        JOB_ID_PATTERN.test(pathSegments[1]) &&
        pathSegments[2] === "upload-finalize"
    ) {
        return pathSegments[1];
    }

    return null;
}
