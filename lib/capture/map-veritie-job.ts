import type { JobDetailResponse } from "@veritie/sdk";
import type { AspectKey } from "@/lib/domain/aspect";
import type { TimelineEventStub } from "@/lib/stubs/timeline-stubs";
import type {
    CaptureStub,
    ExtractedValueStub,
    TranscriptSegmentStub,
    VoiceLogStub,
} from "@/lib/stubs/capture-stubs";

export function mapVeritieJobToCaptureBundle(
    job: JobDetailResponse,
    captureId: string,
): {
    capture: CaptureStub;
    voiceLog: VoiceLogStub;
    segments: TranscriptSegmentStub[];
    extractedValues: ExtractedValueStub[];
    timelineEvents: TimelineEventStub[];
} {
    const now = new Date().toISOString();
    const capture: CaptureStub = {
        id: captureId,
        type: "voice",
        status: job.status === "completed" ? "completed" : "processing",
        title: "Voice log",
        aspectIds: ["personal"],
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
        job.transcript?.segments?.map((segment, index) => ({
            id: `segment_${captureId}_${index}`,
            voiceLogId: voiceLog.id,
            index: segment.index ?? index,
            startMs: segment.start_ms,
            endMs: segment.end_ms,
            text: segment.text,
            speakerLabel: segment.speaker_label,
            confidence: segment.confidence,
        })) ?? [];

    const extractedValues: ExtractedValueStub[] = [];
    const timelineEvents: TimelineEventStub[] = [];

    const payload = job.extraction?.payload ?? {};
    const lists: Array<{
        key: string;
        objectType: ExtractedValueStub["objectType"];
        eventType: TimelineEventStub["type"];
    }> = [
        { key: "tasks", objectType: "task", eventType: "task_detected" },
        { key: "reminders", objectType: "reminder", eventType: "reminder_detected" },
        { key: "goals", objectType: "goal", eventType: "goal_detected" },
        { key: "goal_progress", objectType: "goal_progress", eventType: "goal_progress_detected" },
        { key: "expenses", objectType: "money_entry", eventType: "expense_detected" },
        { key: "records", objectType: "record", eventType: "record_detected" },
        { key: "resources", objectType: "resource", eventType: "resource_detected" },
    ];

    for (const list of lists) {
        const candidates = (payload[list.key] as Array<Record<string, unknown>>) ?? [];
        for (const [index, candidate] of candidates.entries()) {
            const extractedId = `extracted_${captureId}_${list.key}_${index}`;
            const aspect = (candidate.aspect as AspectKey) ?? "personal";
            const title = String(candidate.title ?? list.key);
            const confidence = Number(candidate.confidence ?? 0.5);
            extractedValues.push({
                id: extractedId,
                extractionRunId: `extraction_${captureId}`,
                captureId,
                objectType: list.objectType,
                aspect,
                title,
                fields: (candidate.fields as Record<string, unknown>) ?? {},
                confidence,
                reviewState: "pending",
                createdAt: now,
                updatedAt: now,
            });
            timelineEvents.push({
                id: `timeline_${extractedId}`,
                type: list.eventType,
                title,
                aspect,
                occurredAt: now,
                captureId,
                extractedValueId: extractedId,
                extractedObjectType: list.objectType,
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
    };
}
