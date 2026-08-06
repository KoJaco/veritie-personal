import { NextRequest, NextResponse } from "next/server";
import { requireProgrammaticApiAccess } from "@/lib/api/require-programmatic-api-access";
import {
    BoundedBodyError,
    boundedBodyErrorResponse,
    readBoundedText,
} from "@/lib/api/read-bounded-body";
import { CAPTURES_PERSIST_MAX_BODY_BYTES } from "@/lib/api/body-limits";
import { capturesPersistRequestSchema } from "@/lib/capture/captures-persist-schema";
import { persistCaptureFromVeritieJob } from "@/lib/capture/persist-capture-from-job";
import { isVeritieJobAccessError } from "@/lib/db/repositories/veritie-job-leases";
import { logger } from "@/lib/logging/server-logger";

/**
 * Programmatic persist endpoint (scripts/admin). Browser voice capture uses
 * `persistCaptureAction` server action instead — no bearer secret in the client.
 */
export async function POST(request: NextRequest) {
    const denied = await requireProgrammaticApiAccess(request);
    if (denied) {
        return denied;
    }

    try {
        const rawBody = await readBoundedText(request, CAPTURES_PERSIST_MAX_BODY_BYTES);

        let parsedBody: unknown;
        try {
            parsedBody = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const requestResult = capturesPersistRequestSchema.safeParse(parsedBody);
        if (!requestResult.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: requestResult.error.flatten() },
                { status: 400 },
            );
        }

        const result = await persistCaptureFromVeritieJob(requestResult.data.jobId);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof BoundedBodyError) {
            return boundedBodyErrorResponse(error);
        }

        logger.error("[captures] persist_failed", {
            error: error instanceof Error ? error : String(error),
        });
        const message =
            error instanceof Error ? error.message : "Failed to persist capture";
        const status = message.includes("not available")
            ? 503
            : isVeritieJobAccessError(error)
              ? 403
              : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
