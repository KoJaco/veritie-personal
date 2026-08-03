import { randomUUID } from "crypto";
import {
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

export type PersistCaptureFromJobResult = {
    captureId: string;
    timelineEventCount: number;
    duplicate?: boolean;
};

export async function persistCaptureFromVeritieJob(
    jobId: string,
): Promise<PersistCaptureFromJobResult> {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Capture persistence is not available in this environment");
    }

    const requestResult = capturesPersistRequestSchema.safeParse({ jobId });
    if (!requestResult.success) {
        throw new Error("Invalid job id");
    }

    const validatedJobId = requestResult.data.jobId;

    const existing = findCaptureByVeritieJobId(validatedJobId);
    if (existing) {
        return {
            captureId: existing.id,
            timelineEventCount: 0,
            duplicate: true,
        };
    }

    const veritie = getServerVeritieClient();
    const job = await veritie.getJob(validatedJobId);

    const jobResult = veritieJobPersistSchema.safeParse(job);
    if (!jobResult.success) {
        throw new Error("Invalid job payload from Veritie");
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

    return {
        captureId: bundle.capture.id,
        timelineEventCount: bundle.timelineEvents.length,
    };
}
