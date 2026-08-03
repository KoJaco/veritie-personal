import { NextRequest, NextResponse } from "next/server";
import { requireInternalStubApiAccess } from "@/lib/api/require-internal-stub-api-access";
import { extractedValueReviewRequestSchema } from "@/lib/capture/extracted-value-review-schema";
import { updateExtractedValueReviewState } from "@/lib/data-source/timeline-read-model";
import { logger } from "@/lib/logging/server-logger";

/**
 * Programmatic review-state endpoint. In-app UI uses `updateExtractedValueReviewAction`.
 */
export async function POST(request: NextRequest) {
    const access = requireInternalStubApiAccess(request);
    if (!access.allowed) {
        return NextResponse.json(
            { error: access.message },
            { status: access.status },
        );
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

        updateExtractedValueReviewState(
            parsed.data.extractedValueId,
            parsed.data.reviewState,
        );
        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error("[extracted-values] review_failed", {
            error: error instanceof Error ? error : String(error),
        });
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
