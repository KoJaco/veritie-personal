"use server";

import { requireUser } from "@/lib/auth/require-user";
import { getDataSourceAdapters } from "@/lib/data-source";
import {
    persistCaptureFromVeritieJob,
    enrichCaptureFromVeritieJob,
    type PersistCaptureFromJobResult,
    type EnrichCaptureFromJobResult,
} from "@/lib/capture/persist-capture-from-job";
import { extractedValueReviewRequestSchema } from "@/lib/capture/extracted-value-review-schema";
import {
    extractedValueUpdateAttributesSchema,
    extractedValueUpdateRequestSchema,
} from "@/lib/capture/extracted-value-update-schema";

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

export async function getTimelineEventDetailAction(eventId: string) {
    await requireUser();

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
    await requireUser();

    const parsed = extractedValueReviewRequestSchema.safeParse({
        extractedValueId,
        reviewState,
    });

    if (!parsed.success) {
        return { ok: false, error: "Invalid review payload" };
    }

    const updated = await getDataSourceAdapters().extractedValues.updateExtractedValueReviewState(
        parsed.data.extractedValueId,
        parsed.data.reviewState,
    );
    if (!updated) {
        return { ok: false, error: "Review transition not allowed" };
    }

    return { ok: true };
}

export async function updateExtractedValueAction(
    extractedValueId: string,
    attributes: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
    await requireUser();

    const parsed = extractedValueUpdateRequestSchema.safeParse({
        extractedValueId,
        attributes,
    });

    if (!parsed.success) {
        return { ok: false, error: "Invalid update payload" };
    }

    const attributesResult = extractedValueUpdateAttributesSchema.safeParse(
        parsed.data.attributes,
    );
    if (!attributesResult.success) {
        return { ok: false, error: "Invalid attributes" };
    }

    const updated = await getDataSourceAdapters().extractedValues.updateExtractedValueAttributes(
        parsed.data.extractedValueId,
        attributesResult.data,
    );
    if (!updated) {
        return { ok: false, error: "Extracted value not found" };
    }

    return { ok: true };
}
