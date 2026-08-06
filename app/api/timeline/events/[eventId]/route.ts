import { NextRequest, NextResponse } from "next/server";

import { requireProgrammaticApiAccess } from "@/lib/api/require-programmatic-api-access";
import { getDataSourceAdapters } from "@/lib/data-source";
import { logger } from "@/lib/logging/server-logger";

/**
 * Programmatic timeline detail endpoint. In-app UI uses `getTimelineEventDetailAction`.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> },
) {
    const denied = await requireProgrammaticApiAccess(request);
    if (denied) {
        return denied;
    }

    const { eventId } = await params;
    const trimmed = eventId.trim();

    if (!trimmed || trimmed.length > 128) {
        return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
    }

    const adapters = getDataSourceAdapters();
    const detail = await adapters.timeline.getTimelineEventDetail(trimmed);

    if (!detail) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const captureId = detail.event.captureId;
    const captureDetail = captureId
        ? await adapters.captures.getCaptureDetail(captureId)
        : null;

    return NextResponse.json({ detail, captureDetail });
}

export async function POST() {
    logger.warn("[timeline] events_detail_method_not_allowed");
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
