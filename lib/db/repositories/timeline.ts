import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { extractedValues, timelineEvents, voiceLogs } from "@/db/schema/capture";
import {
    applyTimelineItemSummaryFallback,
    resolveCaptureSummaryFromPayload,
} from "@/lib/capture/extraction-summary";
import { isValidReviewTransition } from "@/lib/capture/extracted-value-review-transitions";
import { getDb } from "@/lib/db";
import type { TimelineIndexQuery } from "@/lib/data-source/timeline-read-model";
import { isHiddenTimelineEventType } from "@/lib/domain/timeline-filters";
import type { ReviewState } from "@/lib/domain/extraction";
import { matchesCalendarDateRange } from "@/lib/format/date-range";
import { sortTimelineIndexItems } from "@/lib/timeline/sort-timeline-index-items";

import type { AccountScope } from "./context";
import {
    buildTimelineEventDetail,
    mapTimelineEventRowToStub,
    mapTimelineEventToIndexItem,
} from "./mappers/timeline";
import { mapExtractedValueRowToStub } from "./mappers/capture";

export async function getTimelineIndex(
    scope: AccountScope,
    query?: TimelineIndexQuery,
) {
    const db = getDb();
    const rows = await db.query.timelineEvents.findMany({
        where: eq(timelineEvents.accountId, scope.accountId),
        orderBy: (table, { desc, asc }) => [
            desc(table.occurredAt),
            desc(table.createdAt),
            asc(table.id),
        ],
    });

    let items = rows.map((row) =>
        mapTimelineEventToIndexItem(mapTimelineEventRowToStub(row)),
    );

    const captureIds = [
        ...new Set(
            items
                .map((item) => item.captureId)
                .filter((id): id is string => Boolean(id)),
        ),
    ];

    if (captureIds.length > 0) {
        const voiceLogRows = await db.query.voiceLogs.findMany({
            where: and(
                eq(voiceLogs.accountId, scope.accountId),
                inArray(voiceLogs.captureId, captureIds),
            ),
        });

        const summaryByCaptureId = new Map<string, string>();
        for (const voiceLogRow of voiceLogRows) {
            const summary = resolveCaptureSummaryFromPayload(
                voiceLogRow.extractionPayload,
            );
            if (summary && voiceLogRow.captureId) {
                summaryByCaptureId.set(voiceLogRow.captureId, summary);
            }
        }

        items = items.map((item) =>
            applyTimelineItemSummaryFallback(
                item,
                item.captureId
                    ? summaryByCaptureId.get(item.captureId)
                    : undefined,
            ),
        );
    }

    const extractedValueIds = [
        ...new Set(
            items
                .map((item) => item.extractedValueId)
                .filter((id): id is string => Boolean(id)),
        ),
    ];

    if (extractedValueIds.length > 0) {
        const extractedValueRows = await db.query.extractedValues.findMany({
            where: and(
                eq(extractedValues.accountId, scope.accountId),
                inArray(extractedValues.id, extractedValueIds),
            ),
        });

        const extractedValueById = new Map(
            extractedValueRows.map((row) => [
                row.id,
                mapExtractedValueRowToStub(row),
            ]),
        );

        items = items.map((item) => {
            if (!item.extractedValueId) {
                return item;
            }
            const extractedValue = extractedValueById.get(item.extractedValueId);
            return extractedValue ? { ...item, extractedValue } : item;
        });
    }

    if (!query?.includeMetaEvents) {
        items = items.filter((item) => !isHiddenTimelineEventType(item.type));
    }

    if (query?.lens) {
        const lensScope = query.lens.scope;
        items = items.filter((item) => {
            if (!query.lens || query.lens.scope === "all") return true;
            return item.aspect === lensScope;
        });
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

    if (query?.startDate || query?.endDate) {
        items = items.filter((item) =>
            matchesCalendarDateRange(
                item.occurredAt,
                query.startDate,
                query.endDate,
            ),
        );
    }

    items = sortTimelineIndexItems(items);

    return { items, total: items.length };
}

export async function getTimelineEventDetail(scope: AccountScope, id: string) {
    const db = getDb();
    const row = await db.query.timelineEvents.findFirst({
        where: and(
            eq(timelineEvents.accountId, scope.accountId),
            eq(timelineEvents.id, id),
        ),
    });

    if (!row) {
        return null;
    }

    const event = mapTimelineEventRowToStub(row);
    let extractedValue: ReturnType<typeof mapExtractedValueRowToStub> | undefined;

    if (event.extractedValueId) {
        const valueRow = await db.query.extractedValues.findFirst({
            where: and(
                eq(extractedValues.accountId, scope.accountId),
                eq(extractedValues.id, event.extractedValueId),
            ),
        });
        if (valueRow) {
            extractedValue = mapExtractedValueRowToStub(valueRow);
        }
    }

    return buildTimelineEventDetail(event, extractedValue);
}

export async function updateExtractedValueReviewState(
    scope: AccountScope,
    extractedValueId: string,
    reviewState: ReviewState,
): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    const existing = await db.query.extractedValues.findFirst({
        where: and(
            eq(extractedValues.accountId, scope.accountId),
            eq(extractedValues.id, extractedValueId),
        ),
        columns: { id: true, reviewState: true },
    });

    if (
        !existing ||
        !isValidReviewTransition(
            existing.reviewState as ReviewState,
            reviewState,
        )
    ) {
        return false;
    }

    const updated = await db
        .update(extractedValues)
        .set({
            reviewState,
            updatedAt: now,
        })
        .where(
            and(
                eq(extractedValues.accountId, scope.accountId),
                eq(extractedValues.id, extractedValueId),
            ),
        )
        .returning({ id: extractedValues.id });

    if (updated.length === 0) {
        return false;
    }

    await db
        .update(timelineEvents)
        .set({
            reviewState,
        })
        .where(
            and(
                eq(timelineEvents.accountId, scope.accountId),
                eq(timelineEvents.extractedValueId, extractedValueId),
            ),
        );

    return true;
}
