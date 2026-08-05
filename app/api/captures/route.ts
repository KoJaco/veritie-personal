import { NextRequest, NextResponse } from "next/server";
import { requireProgrammaticApiAccess } from "@/lib/api/require-programmatic-api-access";
import {
    CAPTURES_PERSIST_MAX_BODY_BYTES,
    capturesPersistRequestSchema,
} from "@/lib/capture/captures-persist-schema";
import { persistCaptureFromVeritieJob } from "@/lib/capture/persist-capture-from-job";
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

    const contentLength = request.headers.get("content-length");
    if (
        contentLength &&
        Number.parseInt(contentLength, 10) > CAPTURES_PERSIST_MAX_BODY_BYTES
    ) {
        return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    try {
        const rawBody = await request.text();
        if (rawBody.length > CAPTURES_PERSIST_MAX_BODY_BYTES) {
            return NextResponse.json({ error: "Request body too large" }, { status: 413 });
        }

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
        logger.error("[captures] persist_failed", {
            error: error instanceof Error ? error : String(error),
        });
        const message =
            error instanceof Error ? error.message : "Failed to persist capture";
        const status = message.includes("not available") ? 503 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
