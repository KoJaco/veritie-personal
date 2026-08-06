import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import {
    captures,
    extractedValues,
    extractionRuns,
    sourceAnchors,
    timelineEvents,
    transcriptSegments,
    voiceLogs,
} from "@/db/schema/capture";
import { usageEvents } from "@/db/schema/identity";
import { getDb } from "@/lib/db";
import type { CapturesIndexQuery } from "@/lib/data-source/captures-read-model";
import { aspectIdsMatchLens } from "@/lib/aspect-lens";

import type { AccountScope } from "./context";
import {
    buildCaptureDetailReadModel,
    mapCaptureRowToStub,
    mapCaptureToIndexItem,
    mapExtractedValueRowToStub,
    mapSegmentRowToStub,
    mapVoiceLogRowToStub,
    type CapturePersistBundle,
} from "./mappers/capture";

function parseDate(value: string): Date {
    return new Date(value);
}

export async function findCaptureByVeritieJobId(
    scope: AccountScope,
    veritieJobId: string,
) {
    const db = getDb();
    const row = await db.query.captures.findFirst({
        where: and(
            eq(captures.accountId, scope.accountId),
            eq(captures.veritieJobId, veritieJobId),
        ),
    });

    return row ? mapCaptureRowToStub(row) : null;
}

export async function getCapturesIndex(
    scope: AccountScope,
    query?: CapturesIndexQuery,
) {
    const db = getDb();
    const rows = await db.query.captures.findMany({
        where: eq(captures.accountId, scope.accountId),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    const captureIds = rows.map((row) => row.id);
    const extractedCounts = new Map<string, number>();

    if (captureIds.length > 0) {
        const valueRows = await db
            .select({
                captureId: extractedValues.captureId,
            })
            .from(extractedValues)
            .where(
                and(
                    eq(extractedValues.accountId, scope.accountId),
                    inArray(extractedValues.captureId, captureIds),
                ),
            );

        for (const row of valueRows) {
            extractedCounts.set(
                row.captureId,
                (extractedCounts.get(row.captureId) ?? 0) + 1,
            );
        }
    }

    let items = rows.map((row) =>
        mapCaptureToIndexItem(
            mapCaptureRowToStub(row),
            extractedCounts.get(row.id) ?? 0,
        ),
    );

    if (query?.lens) {
        items = items.filter((item) =>
            aspectIdsMatchLens(item.aspectIds, { aspect: query.lens!.scope }),
        );
    }

    if (query?.search) {
        const q = query.search.toLowerCase();
        items = items.filter((item) => item.title.toLowerCase().includes(q));
    }

    if (query?.status) {
        items = items.filter((item) => item.status === query.status);
    }

    const sortBy = query?.sortBy ?? "createdAt";
    const sortDir = query?.sortDir ?? "desc";
    const direction = sortDir === "asc" ? 1 : -1;

    items.sort((a, b) => {
        if (sortBy === "title") {
            return a.title.localeCompare(b.title) * direction;
        }
        if (sortBy === "extractedCount") {
            return (a.extractedCount - b.extractedCount) * direction;
        }
        return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            direction
        );
    });

    return { items, total: items.length };
}

export async function getCaptureDetail(scope: AccountScope, id: string) {
    const db = getDb();
    const captureRow = await db.query.captures.findFirst({
        where: and(
            eq(captures.accountId, scope.accountId),
            eq(captures.id, id),
        ),
    });

    if (!captureRow) {
        return null;
    }

    const capture = mapCaptureRowToStub(captureRow);
    const voiceLogRow = await db.query.voiceLogs.findFirst({
        where: and(
            eq(voiceLogs.accountId, scope.accountId),
            eq(voiceLogs.captureId, id),
        ),
    });

    const segments = voiceLogRow
        ? await db.query.transcriptSegments.findMany({
              where: and(
                  eq(transcriptSegments.accountId, scope.accountId),
                  eq(transcriptSegments.voiceLogId, voiceLogRow.id),
              ),
          })
        : [];

    const extractionRunRow = await db.query.extractionRuns.findFirst({
        where: and(
            eq(extractionRuns.accountId, scope.accountId),
            eq(extractionRuns.captureId, id),
        ),
    });

    const valueRows = await db.query.extractedValues.findMany({
        where: and(
            eq(extractedValues.accountId, scope.accountId),
            eq(extractedValues.captureId, id),
        ),
    });

    const valueIds = valueRows.map((row) => row.id);
    const anchorRows =
        valueIds.length > 0
            ? await db.query.sourceAnchors.findMany({
                  where: and(
                      eq(sourceAnchors.accountId, scope.accountId),
                      inArray(sourceAnchors.extractedValueId, valueIds),
                  ),
              })
            : [];

    return buildCaptureDetailReadModel({
        capture,
        voiceLog: voiceLogRow ? mapVoiceLogRowToStub(voiceLogRow) : undefined,
        segments: segments.map(mapSegmentRowToStub),
        extractionRun: extractionRunRow,
        extractedValues: valueRows.map(mapExtractedValueRowToStub),
        sourceAnchors: anchorRows,
    });
}

export async function assertCaptureInAccount(
    scope: AccountScope,
    captureId: string,
): Promise<void> {
    const db = getDb();
    const row = await db.query.captures.findFirst({
        where: and(
            eq(captures.accountId, scope.accountId),
            eq(captures.id, captureId),
        ),
        columns: { id: true },
    });

    if (!row) {
        throw new Error("Capture not found");
    }
}

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "23505"
    );
}

export async function persistCaptureBundle(
    scope: AccountScope,
    bundle: CapturePersistBundle,
) {
    const db = getDb();
    const accountId = scope.accountId;
    const now = new Date();

    try {
        await db.transaction(async (tx) => {
            await tx.insert(captures).values({
                id: bundle.capture.id,
                accountId,
                type: bundle.capture.type,
                status: bundle.capture.status,
                title: bundle.capture.title,
                aspectIds: bundle.capture.aspectIds,
                veritieJobId: bundle.capture.veritieJobId,
                createdAt: parseDate(bundle.capture.createdAt),
                updatedAt: parseDate(bundle.capture.updatedAt),
            });

            const voiceLogValues: typeof voiceLogs.$inferInsert = {
                id: bundle.voiceLog.id,
                accountId,
                captureId: bundle.capture.id,
                transcriptText: bundle.voiceLog.transcriptText,
                language: bundle.voiceLog.language,
                durationMs: bundle.voiceLog.durationMs,
                createdAt: parseDate(bundle.voiceLog.createdAt),
                updatedAt: parseDate(bundle.voiceLog.updatedAt),
            };

            if (bundle.voiceLog.audioUri) {
                voiceLogValues.audioUri = bundle.voiceLog.audioUri;
            }
            if (bundle.voiceLog.indexArtifact != null) {
                voiceLogValues.indexArtifact = bundle.voiceLog.indexArtifact;
            }
            if (bundle.voiceLog.extractionPayload != null) {
                voiceLogValues.extractionPayload =
                    bundle.voiceLog.extractionPayload;
            }

            await tx.insert(voiceLogs).values(voiceLogValues);

            if (bundle.segments.length > 0) {
                await tx.insert(transcriptSegments).values(
                    bundle.segments.map((segment) => {
                        const row: typeof transcriptSegments.$inferInsert = {
                            id: segment.id,
                            accountId,
                            voiceLogId: segment.voiceLogId,
                            index: segment.index,
                            startMs: segment.startMs,
                            endMs: segment.endMs,
                            text: segment.text,
                        };
                        if (segment.speakerLabel) {
                            row.speakerLabel = segment.speakerLabel;
                        }
                        if (segment.confidence != null) {
                            row.confidence = segment.confidence;
                        }
                        return row;
                    }),
                );
            }

            if (bundle.extractedValues.length > 0) {
                const extractionRunId =
                    bundle.extractedValues[0]?.extractionRunId ??
                    `extraction_${bundle.capture.id}`;

                await tx.insert(extractionRuns).values({
                    id: extractionRunId,
                    accountId,
                    captureId: bundle.capture.id,
                    status: "completed",
                    schemaVersion: "1",
                    startedAt: now,
                    completedAt: now,
                    createdAt: now,
                });

                await tx.insert(extractedValues).values(
                    bundle.extractedValues.map((value) => ({
                        id: value.id,
                        accountId,
                        extractionRunId: value.extractionRunId,
                        captureId: value.captureId,
                        objectType: value.objectType,
                        aspect: value.aspect,
                        title: value.title,
                        fields: value.fields,
                        confidence: value.confidence,
                        reviewState: value.reviewState,
                        createdAt: parseDate(value.createdAt),
                        updatedAt: parseDate(value.updatedAt),
                    })),
                );
            }

            if (bundle.timelineEvents.length > 0) {
                await tx.insert(timelineEvents).values(
                    bundle.timelineEvents.map((event) => ({
                        id: event.id,
                        accountId,
                        type: event.type,
                        title: event.title,
                        summary: event.summary,
                        aspect: event.aspect,
                        occurredAt: parseDate(event.occurredAt),
                        captureId: event.captureId,
                        extractedValueId: event.extractedValueId,
                        extractedObjectType: event.extractedObjectType,
                        reviewState: event.reviewState,
                        confidence: event.confidence,
                        createdAt: parseDate(event.createdAt),
                    })),
                );
            }

            if (bundle.capture.veritieJobId) {
                await tx.insert(usageEvents).values({
                    accountId,
                    usageType: "voice_log",
                    quantity: 1,
                    jobId: bundle.capture.veritieJobId,
                });
            }
        });
    } catch (error) {
        if (
            isUniqueViolation(error) &&
            bundle.capture.veritieJobId
        ) {
            const existing = await findCaptureByVeritieJobId(
                scope,
                bundle.capture.veritieJobId,
            );
            if (existing) {
                return { capture: existing, duplicate: true };
            }
        }
        throw error;
    }

    return { capture: bundle.capture };
}

export async function mergeCaptureEnrichment(
    scope: AccountScope,
    input: {
        captureId: string;
        status?: CapturePersistBundle["capture"]["status"];
        extractedValues: CapturePersistBundle["extractedValues"];
        timelineEvents: CapturePersistBundle["timelineEvents"];
        voiceLogArtifacts?: {
            indexArtifact?: Record<string, unknown> | null;
            extractionPayload?: Record<string, unknown> | null;
        };
    },
) {
    const db = getDb();
    const accountId = scope.accountId;
    const now = new Date();

    await assertCaptureInAccount(scope, input.captureId);

    await db.transaction(async (tx) => {
        if (input.status) {
            await tx
                .update(captures)
                .set({
                    status: input.status,
                    updatedAt: now,
                })
                .where(
                    and(
                        eq(captures.accountId, accountId),
                        eq(captures.id, input.captureId),
                    ),
                );
        }

        if (input.extractedValues.length > 0) {
            const existingValues = await tx.query.extractedValues.findMany({
                where: and(
                    eq(extractedValues.accountId, accountId),
                    eq(extractedValues.captureId, input.captureId),
                ),
            });
            const existingIds = new Set(existingValues.map((row) => row.id));
            const newValues = input.extractedValues.filter(
                (value) => !existingIds.has(value.id),
            );

            if (newValues.length > 0) {
                let extractionRunId = existingValues[0]?.extractionRunId;
                if (!extractionRunId) {
                    extractionRunId = `extraction_${input.captureId}`;
                    await tx.insert(extractionRuns).values({
                        id: extractionRunId,
                        accountId,
                        captureId: input.captureId,
                        status: "completed",
                        schemaVersion: "1",
                        startedAt: now,
                        completedAt: now,
                        createdAt: now,
                    });
                }

                await tx.insert(extractedValues).values(
                    newValues.map((value) => ({
                        id: value.id,
                        accountId,
                        extractionRunId: value.extractionRunId ?? extractionRunId!,
                        captureId: value.captureId,
                        objectType: value.objectType,
                        aspect: value.aspect,
                        title: value.title,
                        fields: value.fields,
                        confidence: value.confidence,
                        reviewState: value.reviewState,
                        createdAt: parseDate(value.createdAt),
                        updatedAt: parseDate(value.updatedAt),
                    })),
                );
            }
        }

        if (input.timelineEvents.length > 0) {
            const existingEvents = await tx.query.timelineEvents.findMany({
                where: and(
                    eq(timelineEvents.accountId, accountId),
                    eq(timelineEvents.captureId, input.captureId),
                ),
            });
            const existingEventIds = new Set(existingEvents.map((row) => row.id));
            const newEvents = input.timelineEvents.filter(
                (event) => !existingEventIds.has(event.id),
            );

            if (newEvents.length > 0) {
                await tx.insert(timelineEvents).values(
                    newEvents.map((event) => ({
                        id: event.id,
                        accountId,
                        type: event.type,
                        title: event.title,
                        summary: event.summary,
                        aspect: event.aspect,
                        occurredAt: parseDate(event.occurredAt),
                        captureId: event.captureId,
                        extractedValueId: event.extractedValueId,
                        extractedObjectType: event.extractedObjectType,
                        reviewState: event.reviewState,
                        confidence: event.confidence,
                        createdAt: parseDate(event.createdAt),
                    })),
                );
            }
        }

        if (input.voiceLogArtifacts) {
            const voiceLogUpdate: {
                indexArtifact?: Record<string, unknown> | null;
                extractionPayload?: Record<string, unknown> | null;
                updatedAt: Date;
            } = {
                updatedAt: now,
            };

            if (input.voiceLogArtifacts.indexArtifact !== undefined) {
                voiceLogUpdate.indexArtifact =
                    input.voiceLogArtifacts.indexArtifact;
            }
            if (input.voiceLogArtifacts.extractionPayload !== undefined) {
                voiceLogUpdate.extractionPayload =
                    input.voiceLogArtifacts.extractionPayload;
            }

            await tx
                .update(voiceLogs)
                .set(voiceLogUpdate)
                .where(
                    and(
                        eq(voiceLogs.accountId, accountId),
                        eq(voiceLogs.captureId, input.captureId),
                    ),
                );
        }
    });
}

export async function updateVoiceLogAudioUri(
    scope: AccountScope,
    captureId: string,
    audioUri: string,
): Promise<boolean> {
    const db = getDb();
    const updated = await db
        .update(voiceLogs)
        .set({
            audioUri,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(voiceLogs.accountId, scope.accountId),
                eq(voiceLogs.captureId, captureId),
            ),
        )
        .returning({ id: voiceLogs.id });

    return updated.length > 0;
}
