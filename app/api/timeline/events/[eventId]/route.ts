import { NextResponse } from "next/server";
import { getCaptureDetail } from "@/lib/data-source/captures-read-model";
import { getTimelineEventDetail } from "@/lib/data-source/timeline-read-model";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ eventId: string }> },
) {
    const { eventId } = await params;
    const detail = getTimelineEventDetail(eventId);

    if (!detail) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const captureId = detail.event.captureId;
    const captureDetail = captureId ? getCaptureDetail(captureId) : null;

    return NextResponse.json({ detail, captureDetail });
}
