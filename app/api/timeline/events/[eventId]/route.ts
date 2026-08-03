import { NextRequest, NextResponse } from "next/server";
import { requireInternalStubApiAccess } from "@/lib/api/require-internal-stub-api-access";
import { getCaptureDetail } from "@/lib/data-source/captures-read-model";
import { getTimelineEventDetail } from "@/lib/data-source/timeline-read-model";
import { logger } from "@/lib/logging/server-logger";

/**
 * Programmatic timeline detail endpoint. In-app UI uses `getTimelineEventDetailAction`.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> },
) {
    const access = requireInternalStubApiAccess(request);
    if (!access.allowed) {
        return NextResponse.json(
            { error: access.message },
            { status: access.status },
        );
    }

    const { eventId } = await params;
    const detail = getTimelineEventDetail(eventId);

    if (!detail) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const captureId = detail.event.captureId;
    const captureDetail = captureId ? getCaptureDetail(captureId) : null;

    return NextResponse.json({ detail, captureDetail });
}

export async function POST() {
    logger.warn("[timeline] events_detail_method_not_allowed");
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
