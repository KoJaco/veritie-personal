import { NextRequest, NextResponse } from "next/server";

import { requireProgrammaticApiAccess } from "@/lib/api/require-programmatic-api-access";
import {
    BoundedBodyError,
    boundedBodyErrorResponse,
    readBoundedJson,
} from "@/lib/api/read-bounded-body";
import { EXTRACTED_VALUE_REVIEW_MAX_BODY_BYTES } from "@/lib/api/body-limits";
import { extractedValueReviewRequestSchema } from "@/lib/capture/extracted-value-review-schema";
import { getDataSourceAdapters } from "@/lib/data-source";
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
        const body = await readBoundedJson(
            request,
            EXTRACTED_VALUE_REVIEW_MAX_BODY_BYTES,
        );
        const parsed = extractedValueReviewRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid payload", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const updated = await getDataSourceAdapters().extractedValues.updateExtractedValueReviewState(
            parsed.data.extractedValueId,
            parsed.data.reviewState,
        );
        if (!updated) {
            return NextResponse.json(
                { error: "Extracted value not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        if (error instanceof BoundedBodyError) {
            return boundedBodyErrorResponse(error);
        }
        logger.error("[extracted-values] review_failed", {
            error: error instanceof Error ? error : String(error),
        });
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
