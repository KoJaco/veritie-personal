import type {
    captures,
    extractedValues,
    extractionRuns,
    sourceAnchors,
    transcriptSegments,
    voiceLogs,
} from "@/db/schema/capture";
import type { CaptureDetailReadModel, CaptureIndexItem } from "@/lib/data-source/captures-read-model";
import type {
    CaptureStub,
    ExtractedValueStub,
    TranscriptSegmentStub,
    VoiceLogStub,
} from "@/lib/stubs/capture-stubs";
import type { AspectKey } from "@/lib/domain/aspect";
import type { ExtractionRunStatus } from "@/lib/domain/extraction";

type CaptureRow = typeof captures.$inferSelect;
type VoiceLogRow = typeof voiceLogs.$inferSelect;
type SegmentRow = typeof transcriptSegments.$inferSelect;
type ExtractionRunRow = typeof extractionRuns.$inferSelect;
type ExtractedValueRow = typeof extractedValues.$inferSelect;
type SourceAnchorRow = typeof sourceAnchors.$inferSelect;

function toIso(date: Date | string): string {
    return date instanceof Date ? date.toISOString() : String(date);
}

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
    return value === null || value === undefined ? undefined : value;
}

export function mapCaptureRowToStub(row: CaptureRow): CaptureStub {
    return {
        id: row.id,
        type: row.type as CaptureStub["type"],
        status: row.status as CaptureStub["status"],
        title: nullToUndefined(row.title),
        aspectIds: (row.aspectIds ?? []) as AspectKey[],
        veritieJobId: nullToUndefined(row.veritieJobId),
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
    };
}

export function mapVoiceLogRowToStub(row: VoiceLogRow): VoiceLogStub {
    return {
        id: row.id,
        captureId: row.captureId,
        transcriptText: nullToUndefined(row.transcriptText),
        language: nullToUndefined(row.language),
        durationMs: nullToUndefined(row.durationMs),
        audioUri: nullToUndefined(row.audioUri),
        indexArtifact: nullToUndefined(row.indexArtifact) as
            | Record<string, unknown>
            | undefined,
        extractionPayload: nullToUndefined(row.extractionPayload) as
            | Record<string, unknown>
            | undefined,
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
    };
}

export function mapSegmentRowToStub(row: SegmentRow): TranscriptSegmentStub {
    return {
        id: row.id,
        voiceLogId: row.voiceLogId,
        index: row.index,
        startMs: row.startMs,
        endMs: row.endMs,
        text: row.text,
        speakerLabel: nullToUndefined(row.speakerLabel),
        confidence: nullToUndefined(row.confidence),
    };
}

export function mapExtractedValueRowToStub(row: ExtractedValueRow): ExtractedValueStub {
    return {
        id: row.id,
        extractionRunId: row.extractionRunId,
        captureId: row.captureId,
        objectType: row.objectType as ExtractedValueStub["objectType"],
        aspect: row.aspect as AspectKey,
        title: row.title,
        fields: row.fields ?? {},
        confidence: row.confidence,
        reviewState: row.reviewState as ExtractedValueStub["reviewState"],
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
    };
}

export function mapCaptureToIndexItem(
    capture: CaptureStub,
    extractedCount: number,
    extractedSummary: string | null = null,
): CaptureIndexItem {
    return {
        id: capture.id,
        title: capture.title ?? "Untitled capture",
        type: capture.type,
        status: capture.status,
        aspectIds: capture.aspectIds,
        createdAt: capture.createdAt,
        extractedCount,
        extractedSummary,
    };
}

export function buildCaptureDetailReadModel(input: {
    capture: CaptureStub;
    voiceLog?: VoiceLogStub;
    segments: TranscriptSegmentStub[];
    extractionRun?: ExtractionRunRow;
    extractedValues: ExtractedValueStub[];
    sourceAnchors: SourceAnchorRow[];
}): CaptureDetailReadModel {
    return {
        capture: input.capture,
        voiceLog: input.voiceLog,
        segments: input.segments,
        extractionRun: input.extractionRun
            ? {
                  id: input.extractionRun.id,
                  captureId: input.extractionRun.captureId,
                  status: input.extractionRun.status as ExtractionRunStatus,
                  schemaVersion: nullToUndefined(
                      input.extractionRun.schemaVersion,
                  ),
                  startedAt: input.extractionRun.startedAt
                      ? toIso(input.extractionRun.startedAt)
                      : undefined,
                  completedAt: input.extractionRun.completedAt
                      ? toIso(input.extractionRun.completedAt)
                      : undefined,
                  errorMessage: nullToUndefined(
                      input.extractionRun.errorMessage,
                  ),
                  createdAt: toIso(input.extractionRun.createdAt),
              }
            : undefined,
        extractedValues: input.extractedValues,
        sourceAnchors: input.sourceAnchors.map((anchor) => ({
            id: anchor.id,
            extractedValueId: anchor.extractedValueId,
            startMs: nullToUndefined(anchor.startMs),
            endMs: nullToUndefined(anchor.endMs),
            textStart: nullToUndefined(anchor.textStart),
            textEnd: nullToUndefined(anchor.textEnd),
            quote: nullToUndefined(anchor.quote),
            segmentIds: nullToUndefined(anchor.segmentIds),
            confidence: nullToUndefined(anchor.confidence),
        })),
    };
}

export interface CapturePersistBundle {
    capture: CaptureStub;
    voiceLog: VoiceLogStub;
    segments: TranscriptSegmentStub[];
    extractedValues: ExtractedValueStub[];
    timelineEvents: import("@/lib/stubs/timeline-stubs").TimelineEventStub[];
    extractionSchemaVersion?: string | null;
}
