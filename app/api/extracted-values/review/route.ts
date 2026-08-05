import { NextRequest, NextResponse } from "next/server";

import { requireProgrammaticApiAccess } from "@/lib/api/require-programmatic-api-access";
import { extractedValueReviewRequestSchema } from "@/lib/capture/extracted-value-review-schema";
import { getDataSourceKind } from "@/lib/data-source/registry";
import { updateExtractedValueReviewState as updateStubExtractedValueReviewState } from "@/lib/data-source/timeline-read-model";
import { requireAccountScope } from "@/lib/db/repositories/context";
import { updateExtractedValueReviewState as updateDbExtractedValueReviewState } from "@/lib/db/repositories/timeline";
import { logger } from "@/lib/logging/server-logger";

/**
 * Programmatic review-state endpoint. In-app UI uses `updateExtractedValueReviewAction`.
 */
export async function POST(request: NextRequest) {
    const denied = await requireProgrammaticApiAccess(request);
    if (denied) {
        return denied;
    }

    try {
        const body = await request.json();
        const parsed = extractedValueReviewRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid payload", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        if (getDataSourceKind() === "backend") {
            const scope = await requireAccountScope();
            const updated = await updateDbExtractedValueReviewState(
                scope,
                parsed.data.extractedValueId,
                parsed.data.reviewState,
            );
            if (!updated) {
                return NextResponse.json(
                    { error: "Extracted value not found" },
                    { status: 404 },
                );
            }
        } else {
            const updated = updateStubExtractedValueReviewState(
                parsed.data.extractedValueId,
                parsed.data.reviewState,
            );
            if (!updated) {
                return NextResponse.json(
                    { error: "Extracted value not found" },
                    { status: 404 },
                );
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error("[extracted-values] review_failed", {
            error: error instanceof Error ? error : String(error),
        });
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
