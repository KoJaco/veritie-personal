"use server";

import { getCaptureDetail } from "@/lib/data-source/captures-read-model";
import { getTimelineEventDetail } from "@/lib/data-source/timeline-read-model";
import { updateExtractedValueReviewState } from "@/lib/data-source/timeline-read-model";
import {
    persistCaptureFromVeritieJob,
    enrichCaptureFromVeritieJob,
    type PersistCaptureFromJobResult,
    type EnrichCaptureFromJobResult,
} from "@/lib/capture/persist-capture-from-job";
import { extractedValueReviewRequestSchema } from "@/lib/capture/extracted-value-review-schema";
import type { TimelineEventDetailReadModel } from "@/lib/data-source/timeline-read-model";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";

export async function persistCaptureAction(
    jobId: string,
): Promise<PersistCaptureFromJobResult> {
    return persistCaptureFromVeritieJob(jobId);
}

export async function enrichCaptureAction(
    jobId: string,
): Promise<EnrichCaptureFromJobResult> {
    return enrichCaptureFromVeritieJob(jobId);
}

export async function getTimelineEventDetailAction(eventId: string): Promise<{
    detail: TimelineEventDetailReadModel;
    captureDetail: CaptureDetailReadModel | null;
} | null> {
    const trimmed = eventId.trim();
    if (!trimmed || trimmed.length > 128) {
        return null;
    }

    const detail = getTimelineEventDetail(trimmed);
    if (!detail) {
        return null;
    }

    const captureId = detail.event.captureId;
    const captureDetail = captureId ? getCaptureDetail(captureId) : null;

    return { detail, captureDetail };
}

export async function updateExtractedValueReviewAction(
    extractedValueId: string,
    reviewState: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    const parsed = extractedValueReviewRequestSchema.safeParse({
        extractedValueId,
        reviewState,
    });

    if (!parsed.success) {
        return { ok: false, error: "Invalid review payload" };
    }

    updateExtractedValueReviewState(
        parsed.data.extractedValueId,
        parsed.data.reviewState,
    );

    return { ok: true };
}
