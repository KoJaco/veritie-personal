"use server";

import { getDataSourceAdapters } from "@/lib/data-source";
import { getDataSourceKind } from "@/lib/data-source/registry";
import { requireAccountScope } from "@/lib/db/repositories/context";
import { updateExtractedValueReviewState as updateDbExtractedValueReviewState } from "@/lib/db/repositories/timeline";
import { updateExtractedValueReviewState as updateStubExtractedValueReviewState } from "@/lib/data-source/timeline-read-model";
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

    const adapters = getDataSourceAdapters();
    const detail = await adapters.timeline.getTimelineEventDetail(trimmed);
    if (!detail) {
        return null;
    }

    const captureId = detail.event.captureId;
    const captureDetail = captureId
        ? await adapters.captures.getCaptureDetail(captureId)
        : null;

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

    if (getDataSourceKind() === "backend") {
        const scope = await requireAccountScope();
        await updateDbExtractedValueReviewState(
            scope,
            parsed.data.extractedValueId,
            parsed.data.reviewState,
        );
    } else {
        updateStubExtractedValueReviewState(
            parsed.data.extractedValueId,
            parsed.data.reviewState,
        );
    }

    return { ok: true };
}
