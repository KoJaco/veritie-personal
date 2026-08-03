import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireCapturesPersistAccess } from "@/lib/api/require-captures-persist-access";
import {
    CAPTURES_PERSIST_MAX_BODY_BYTES,
    capturesPersistRequestSchema,
    veritieJobPersistSchema,
} from "@/lib/capture/captures-persist-schema";
import { mapVeritieJobToCaptureBundle } from "@/lib/capture/map-veritie-job";
import { envServer } from "@/lib/config/env.server";
import {
    appendCaptureFromJob,
    findCaptureByVeritieJobId,
} from "@/lib/data-source/captures-read-model";
import { appendTimelineEvents } from "@/lib/data-source/timeline-read-model";
import { getServerVeritieClient } from "@/lib/veritie/server-client";

export async function POST(request: NextRequest) {
    const access = requireCapturesPersistAccess(request);
    if (!access.allowed) {
        return NextResponse.json(
            { error: access.message },
            { status: access.status },
        );
    }

    if (!envServer.allowStubCaptureMutations) {
        return NextResponse.json(
            {
                error: "Capture persistence is not available in this environment",
            },
            { status: 503 },
        );
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

        const { jobId } = requestResult.data;

        const existing = findCaptureByVeritieJobId(jobId);
        if (existing) {
            return NextResponse.json({
                captureId: existing.id,
                timelineEventCount: 0,
                duplicate: true,
            });
        }

        const veritie = getServerVeritieClient();
        const job = await veritie.getJob(jobId);

        const jobResult = veritieJobPersistSchema.safeParse(job);
        if (!jobResult.success) {
            return NextResponse.json(
                { error: "Invalid job payload from Veritie", details: jobResult.error.flatten() },
                { status: 422 },
            );
        }

        const captureId = `capture_${randomUUID()}`;
        const bundle = mapVeritieJobToCaptureBundle(jobResult.data, captureId);
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
