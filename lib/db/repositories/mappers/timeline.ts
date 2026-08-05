import type { timelineEvents } from "@/db/schema/capture";
import type {
    TimelineEventDetailReadModel,
    TimelineIndexItem,
} from "@/lib/data-source/timeline-read-model";
import type { TimelineEventStub } from "@/lib/stubs/timeline-stubs";
import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";
import type { AspectKey } from "@/lib/domain/aspect";
import type { TimelineEventType } from "@/lib/domain/timeline";
import type { ReviewState } from "@/lib/domain/extraction";

type TimelineEventRow = typeof timelineEvents.$inferSelect;

function toIso(date: Date | string): string {
    return date instanceof Date ? date.toISOString() : String(date);
}

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
    return value === null || value === undefined ? undefined : value;
}

export function mapTimelineEventRowToStub(row: TimelineEventRow): TimelineEventStub {
    return {
        id: row.id,
        type: row.type as TimelineEventType,
        title: row.title,
        summary: nullToUndefined(row.summary),
        aspect: row.aspect as AspectKey,
        occurredAt: toIso(row.occurredAt),
        captureId: nullToUndefined(row.captureId),
        extractedValueId: nullToUndefined(row.extractedValueId),
        extractedObjectType: nullToUndefined(
            row.extractedObjectType as ExtractedValueStub["objectType"] | null,
        ),
        reviewState: nullToUndefined(row.reviewState as ReviewState | null),
        confidence: nullToUndefined(row.confidence),
        createdAt: toIso(row.createdAt),
    };
}

export function mapTimelineEventToIndexItem(
    event: TimelineEventStub,
): TimelineIndexItem {
    return {
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
    };
}

export function buildTimelineEventDetail(
    event: TimelineEventStub,
    extractedValue?: ExtractedValueStub,
): TimelineEventDetailReadModel {
    return {
        event,
        extractedValue,
    };
}
