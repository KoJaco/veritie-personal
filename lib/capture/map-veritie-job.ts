import type { ValidatedVeritieJob } from "@/lib/capture/captures-persist-schema";
import { buildCaptureSegmentId } from "@/lib/capture/capture-segment-ids";
import {
    deriveCaptureAspectIds,
    deriveCaptureTitle,
    getExtractionListCandidates,
    normalizeExtractionAspect,
    resolveExtractionCandidateTitle,
    splitExtractionCandidateFields,
} from "@/lib/capture/extraction-aspect";
import {
    resolvePipelineExtractionConfig,
    type PipelineExtractionConfig,
} from "@/lib/capture/pipeline-config";
import type { TimelineEventStub } from "@/lib/stubs/timeline-stubs";
import type {
    CaptureStub,
    ExtractedValueStub,
    TranscriptSegmentStub,
    VoiceLogStub,
} from "@/lib/stubs/capture-stubs";

export function mapVeritieJobToCaptureBundle(
    job: ValidatedVeritieJob,
    captureId: string,
    extractionConfig: PipelineExtractionConfig = resolvePipelineExtractionConfig(null),
): {
    capture: CaptureStub;
    voiceLog: VoiceLogStub;
    segments: TranscriptSegmentStub[];
    extractedValues: ExtractedValueStub[];
    timelineEvents: TimelineEventStub[];
    extractionSchemaVersion: string | null;
} {
    const now = new Date().toISOString();
    const payload = (job.extraction?.payload ?? {}) as Record<string, unknown>;
    const aspectIds = deriveCaptureAspectIds(
        payload,
        extractionConfig.extractionListKeys,
    );
    const captureTitle = deriveCaptureTitle(payload) ?? "Voice log";

    const capture: CaptureStub = {
        id: captureId,
        type: "voice",
        status: job.status === "completed" ? "completed" : "processing",
        title: captureTitle,
        aspectIds,
        veritieJobId: job.job_id,
        createdAt: now,
        updatedAt: now,
    };

    const voiceLog: VoiceLogStub = {
        id: `voice_${captureId}`,
        captureId,
        transcriptText: job.transcript?.text,
        language: job.transcript?.language,
        durationMs: job.transcript?.duration_ms,
        createdAt: now,
        updatedAt: now,
    };

    const segments: TranscriptSegmentStub[] =
        job.transcript?.segments?.map((segment, index) => {
            const segmentIndex = segment.index ?? index;
            return {
                id: buildCaptureSegmentId(captureId, segmentIndex),
                voiceLogId: voiceLog.id,
                index: segmentIndex,
                startMs: segment.start_ms ?? 0,
                endMs: segment.end_ms ?? 0,
                text: segment.text ?? "",
                speakerLabel: segment.speaker_label,
                confidence: segment.confidence,
            };
        }) ?? [];

    const extractedValues: ExtractedValueStub[] = [];
    const timelineEvents: TimelineEventStub[] = [];

    for (const listKey of extractionConfig.extractionListKeys) {
        const objectType = extractionConfig.objectTypesByKey[listKey];
        const eventType = extractionConfig.eventTypesByKey[listKey];
        if (!objectType || !eventType) {
            continue;
        }

        const candidates = getExtractionListCandidates(payload, listKey);
        for (const [index, candidate] of candidates.entries()) {
            if (!candidate || typeof candidate !== "object") {
                continue;
            }

            const record = candidate as Record<string, unknown>;
            const extractedId = `extracted_${captureId}_${listKey}_${index}`;
            const aspect = normalizeExtractionAspect(
                typeof record.aspect === "string" ? record.aspect : undefined,
            );
            const title = resolveExtractionCandidateTitle(listKey, record);
            const confidence = Math.min(
                1,
                Math.max(
                    0,
                    typeof record.confidence === "number" ? record.confidence : 0.5,
                ),
            );
            const fields = splitExtractionCandidateFields(record);

            extractedValues.push({
                id: extractedId,
                extractionRunId: `extraction_${captureId}`,
                captureId,
                objectType,
                aspect,
                title,
                fields,
                confidence,
                reviewState: "pending",
                createdAt: now,
                updatedAt: now,
            });
            timelineEvents.push({
                id: `timeline_${extractedId}`,
                type: eventType as TimelineEventStub["type"],
                title,
                aspect,
                occurredAt: now,
                captureId,
                extractedValueId: extractedId,
                extractedObjectType: objectType,
                reviewState: "pending",
                confidence,
                createdAt: now,
            });
        }
    }

    return {
        capture,
        voiceLog,
        segments,
        extractedValues,
        timelineEvents,
        extractionSchemaVersion: extractionConfig.schemaVersionId,
    };
}
