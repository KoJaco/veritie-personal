import { NextRequest, NextResponse } from "next/server";
import type { JobDetailResponse } from "@veritie/sdk";
import { mapVeritieJobToCaptureBundle } from "@/lib/capture/map-veritie-job";
import { appendCaptureFromJob } from "@/lib/data-source/captures-read-model";
import { appendTimelineEvents } from "@/lib/data-source/timeline-read-model";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const job = body.job as JobDetailResponse | undefined;
        const captureId =
            typeof body.captureId === "string"
                ? body.captureId
                : `capture_${Date.now()}`;

        if (!job?.job_id) {
            return NextResponse.json(
                { error: "Missing job payload" },
                { status: 400 },
            );
        }

        const bundle = mapVeritieJobToCaptureBundle(job, captureId);
        appendCaptureFromJob({
            capture: bundle.capture,
            voiceLog: bundle.voiceLog,
            segments: bundle.segments,
            extractedValues: bundle.extractedValues,
        });
        appendTimelineEvents(bundle.timelineEvents);

        return NextResponse.json({
            captureId: bundle.capture.id,
            timelineEventCount: bundle.timelineEvents.length,
        });
    } catch (error) {
        console.error("[captures] persist_failed", error);
        return NextResponse.json(
            { error: "Failed to persist capture" },
            { status: 500 },
        );
    }
}
