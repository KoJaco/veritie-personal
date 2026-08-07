import "server-only";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
    extractedValues,
    timelineEvents,
    voiceLogs,
} from "@/db/schema/capture";
import {
    applyAttributesToExtractionPayload,
    applyIndexQuoteUpdates,
    collectIndexQuoteUpdates,
    deriveExtractedValueFromCandidate,
    deriveTimelineEventSummary,
} from "@/lib/capture/update-extracted-value-artifacts";
import { parseExtractedValueId } from "@/lib/capture/extracted-value-path";
import { getExtractionListCandidates } from "@/lib/capture/extraction-aspect";
import { getDb } from "@/lib/db";

import type { AccountScope } from "./context";

export async function updateExtractedValueAttributes(
    scope: AccountScope,
    extractedValueId: string,
    attributes: Record<string, unknown>,
): Promise<boolean> {
    const parsedId = parseExtractedValueId(extractedValueId);
    if (!parsedId) {
        return false;
    }

    const db = getDb();
    const now = new Date();

    const valueRow = await db.query.extractedValues.findFirst({
        where: and(
            eq(extractedValues.accountId, scope.accountId),
            eq(extractedValues.id, extractedValueId),
        ),
    });

    if (!valueRow) {
        return false;
    }

    const voiceLogRow = await db.query.voiceLogs.findFirst({
        where: and(
            eq(voiceLogs.accountId, scope.accountId),
            eq(voiceLogs.captureId, parsedId.captureId),
        ),
    });

    const nextPayload = applyAttributesToExtractionPayload(
        (voiceLogRow?.extractionPayload as Record<string, unknown> | null) ??
            null,
        parsedId.listKey,
        parsedId.index,
        attributes,
    );

    const candidates = getExtractionListCandidates(nextPayload, parsedId.listKey);
    const candidate =
        candidates[parsedId.index] &&
        typeof candidates[parsedId.index] === "object"
            ? (candidates[parsedId.index] as Record<string, unknown>)
            : attributes;

    const derived = deriveExtractedValueFromCandidate(
        parsedId.listKey,
        candidate,
    );
    const summary = deriveTimelineEventSummary(candidate);
    const quoteUpdates = collectIndexQuoteUpdates(
        parsedId.listKey,
        parsedId.index,
        attributes,
    );
    const nextIndexArtifact = applyIndexQuoteUpdates(
        voiceLogRow?.indexArtifact as Record<string, unknown> | null,
        quoteUpdates,
    );

    await db.transaction(async (tx) => {
        await tx
            .update(extractedValues)
            .set({
                title: derived.title,
                aspect: derived.aspect,
                fields: derived.fields,
                reviewState: "edited",
                updatedAt: now,
            })
            .where(
                and(
                    eq(extractedValues.accountId, scope.accountId),
                    eq(extractedValues.id, extractedValueId),
                ),
            );

        await tx
            .update(timelineEvents)
            .set({
                title: derived.title,
                aspect: derived.aspect,
                summary,
                reviewState: "edited",
            })
            .where(
                and(
                    eq(timelineEvents.accountId, scope.accountId),
                    eq(timelineEvents.extractedValueId, extractedValueId),
                ),
            );

        if (voiceLogRow) {
            await tx
                .update(voiceLogs)
                .set({
                    extractionPayload: nextPayload,
                    indexArtifact: nextIndexArtifact ?? voiceLogRow.indexArtifact,
                    updatedAt: now,
                })
                .where(
                    and(
                        eq(voiceLogs.accountId, scope.accountId),
                        eq(voiceLogs.id, voiceLogRow.id),
                    ),
                );
        }
    });

    revalidatePath("/captures");
    revalidatePath(`/captures/${parsedId.captureId}`);
    revalidatePath("/timeline");

    return true;
}
