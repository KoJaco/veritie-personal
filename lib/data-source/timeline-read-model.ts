import { envServer } from "@/lib/config/env.server";
import type { AspectKey } from "@/lib/domain/aspect";
import type { ReviewState } from "@/lib/domain/extraction";
import type { TimelineEventType } from "@/lib/domain/timeline";
import {
    isHiddenTimelineEventType,
} from "@/lib/domain/timeline-filters";
import type { ScopeLens } from "@/lib/lens";
import { TIMELINE_EVENT_SEEDS, type TimelineEventStub } from "@/lib/stubs/timeline-stubs";
import {
    EXTRACTED_VALUE_SEEDS,
    VOICE_LOG_SEEDS,
    type ExtractedValueStub,
} from "@/lib/stubs/capture-stubs";
import {
    applyTimelineItemSummaryFallback,
    resolveCaptureSummaryFromPayload,
} from "@/lib/capture/extraction-summary";
import { isValidReviewTransition } from "@/lib/capture/extracted-value-review-transitions";
import { sortTimelineIndexItems } from "@/lib/timeline/sort-timeline-index-items";

export type TimelineIndexItem = {
    id: string;
    type: TimelineEventType;
    title: string;
    summary?: string;
    aspect: AspectKey;
    occurredAt: string;
    captureId?: string;
    extractedValueId?: string;
    extractedObjectType?: ExtractedValueStub["objectType"];
    extractedValue?: ExtractedValueStub;
    reviewState?: ReviewState;
    confidence?: number;
    createdAt?: string;
};

export type TimelineIndexReadModel = {
    items: TimelineIndexItem[];
    total: number;
};

export type TimelineEventDetailReadModel = {
    event: TimelineEventStub;
    extractedValue?: ExtractedValueStub;
};

export type TimelineIndexQuery = {
    lens?: ScopeLens;
    search?: string;
    eventTypes?: TimelineEventType[];
    reviewStates?: ReviewState[];
    captureId?: string;
    startDate?: string;
    endDate?: string;
    /** When true, include capture_created and extraction_completed rows. */
    includeMetaEvents?: boolean;
};

function matchesLens(event: TimelineEventStub, lens?: ScopeLens): boolean {
    if (!lens || lens.scope === "all") return true;
    return event.aspect === lens.scope;
}

function resolveCaptureSummaryForId(captureId: string | undefined): string | undefined {
    if (!captureId) {
        return undefined;
    }

    const voiceLog = VOICE_LOG_SEEDS.find((log) => log.captureId === captureId);
    return resolveCaptureSummaryFromPayload(voiceLog?.extractionPayload);
}

function attachExtractedValueToIndexItem(
    item: TimelineIndexItem,
): TimelineIndexItem {
    if (!item.extractedValueId) {
        return item;
    }

    const extractedValue = EXTRACTED_VALUE_SEEDS.find(
        (value) => value.id === item.extractedValueId,
    );

    return extractedValue ? { ...item, extractedValue } : item;
}

export function getTimelineIndex(
    query?: TimelineIndexQuery,
): TimelineIndexReadModel {
    let items: TimelineIndexItem[] = TIMELINE_EVENT_SEEDS.map((event) =>
        attachExtractedValueToIndexItem(
            applyTimelineItemSummaryFallback(
                {
                    id: event.id,
                    type: event.type,
                    title: event.title,
                    summary: event.summary,
                    aspect: event.aspect,
                    occurredAt: event.occurredAt,
                    captureId: event.captureId,
                    extractedValueId: event.extractedValueId,
                    extractedObjectType: event.extractedObjectType,
                    reviewState: event.reviewState,
                    confidence: event.confidence,
                    createdAt: event.createdAt,
                },
                resolveCaptureSummaryForId(event.captureId),
            ),
        ),
    );

    if (!query?.includeMetaEvents) {
        items = items.filter((item) => !isHiddenTimelineEventType(item.type));
    }

    if (query?.lens) {
        items = items.filter((item) =>
            matchesLens(
                TIMELINE_EVENT_SEEDS.find((e) => e.id === item.id)!,
                query.lens,
            ),
        );
    }

    if (query?.search) {
        const q = query.search.toLowerCase();
        items = items.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                (item.summary?.toLowerCase().includes(q) ?? false),
        );
    }

    if (query?.eventTypes?.length) {
        items = items.filter((item) => query.eventTypes!.includes(item.type));
    }

    if (query?.reviewStates?.length) {
        items = items.filter(
            (item) =>
                item.reviewState &&
                query.reviewStates!.includes(item.reviewState),
        );
    }

    if (query?.captureId) {
        items = items.filter((item) => item.captureId === query.captureId);
    }

    if (query?.startDate) {
        items = items.filter((item) => item.occurredAt >= query.startDate!);
    }

    if (query?.endDate) {
        items = items.filter((item) => item.occurredAt <= query.endDate!);
    }

    items = sortTimelineIndexItems(items);

    return { items, total: items.length };
}

export function getTimelineEventDetail(
    id: string,
): TimelineEventDetailReadModel | null {
    const event = TIMELINE_EVENT_SEEDS.find((e) => e.id === id);
    if (!event) return null;

    const extractedValue = event.extractedValueId
        ? EXTRACTED_VALUE_SEEDS.find((v) => v.id === event.extractedValueId)
        : undefined;

    return { event, extractedValue };
}

export function appendTimelineEvents(events: TimelineEventStub[]): void {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Stub timeline mutations are disabled");
    }
    TIMELINE_EVENT_SEEDS.push(...events);
}

export function updateExtractedValueReviewState(
    id: string,
    reviewState: ReviewState,
): boolean {
    const value = EXTRACTED_VALUE_SEEDS.find((v) => v.id === id);
    if (!value) {
        return false;
    }

    if (!isValidReviewTransition(value.reviewState, reviewState)) {
        return false;
    }

    value.reviewState = reviewState;
    value.updatedAt = new Date().toISOString();

    const event = TIMELINE_EVENT_SEEDS.find(
        (e) => e.extractedValueId === id,
    );
    if (event) {
        event.reviewState = reviewState;
    }

    return true;
}
