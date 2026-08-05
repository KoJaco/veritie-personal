import "server-only";

import { and, eq } from "drizzle-orm";

import { extractedValues, timelineEvents } from "@/db/schema/capture";
import { getDb } from "@/lib/db";
import type { TimelineIndexQuery } from "@/lib/data-source/timeline-read-model";
import { isHiddenTimelineEventType } from "@/lib/domain/timeline-filters";
import type { ReviewState } from "@/lib/domain/extraction";

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
        orderBy: (table, { desc }) => [desc(table.occurredAt)],
    });

    let items = rows.map((row) =>
        mapTimelineEventToIndexItem(mapTimelineEventRowToStub(row)),
    );

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

    if (query?.startDate) {
        items = items.filter((item) => item.occurredAt >= query.startDate!);
    }

    if (query?.endDate) {
        items = items.filter((item) => item.occurredAt <= query.endDate!);
    }

    items.sort(
        (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

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
) {
    const db = getDb();
    const now = new Date();

    await db
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
        );

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
}
