import { buildExtractedValueId } from "@/lib/capture/extracted-value-path";
import {
    CAPTURE_SEEDS,
    EXTRACTED_VALUE_SEEDS,
    VOICE_LOG_SEEDS,
    type CaptureStub,
    type ExtractedValueStub,
    type VoiceLogStub,
} from "@/lib/stubs/capture-stubs";
import { TIMELINE_EVENT_SEEDS, type TimelineEventStub } from "@/lib/stubs/timeline-stubs";
import { updateExtractedValueAttributes } from "@/lib/data-source/captures-read-model";

jest.mock("@/lib/config/env.server", () => ({
    envServer: {
        allowStubCaptureMutations: true,
    },
}));

describe("updateExtractedValueAttributes (stub)", () => {
    const captureId = "capture_test_edit_sync";
    const extractedValueId = buildExtractedValueId(captureId, "reminders", 0);

    beforeAll(() => {
        const capture: CaptureStub = {
            id: captureId,
            type: "voice",
            status: "completed",
            title: "Test capture",
            aspectIds: ["admin"],
            createdAt: "2026-08-01T08:00:00.000Z",
            updatedAt: "2026-08-01T08:00:00.000Z",
        };
        const voiceLog: VoiceLogStub = {
            id: `voice_${captureId}`,
            captureId,
            extractionPayload: {
                reminders: [
                    {
                        title: "Old reminder title",
                        aspect: "admin",
                    },
                ],
            },
            createdAt: "2026-08-01T08:00:00.000Z",
            updatedAt: "2026-08-01T08:00:00.000Z",
        };
        const extractedValue: ExtractedValueStub = {
            id: extractedValueId,
            extractionRunId: `extraction_${captureId}`,
            captureId,
            objectType: "reminder",
            aspect: "admin",
            title: "Old reminder title",
            fields: {},
            confidence: 0.8,
            reviewState: "pending",
            createdAt: "2026-08-01T08:00:00.000Z",
            updatedAt: "2026-08-01T08:00:00.000Z",
        };
        const timelineEvent: TimelineEventStub = {
            id: `timeline_${extractedValueId}`,
            type: "reminder_detected",
            title: "Old reminder title",
            aspect: "admin",
            occurredAt: "2026-08-01T08:00:00.000Z",
            captureId,
            extractedValueId,
            extractedObjectType: "reminder",
            reviewState: "pending",
            confidence: 0.8,
            createdAt: "2026-08-01T08:00:00.000Z",
        };

        CAPTURE_SEEDS.push(capture);
        VOICE_LOG_SEEDS.push(voiceLog);
        EXTRACTED_VALUE_SEEDS.push(extractedValue);
        TIMELINE_EVENT_SEEDS.push(timelineEvent);
    });

    it("updates extracted value, payload, and timeline event", () => {
        const updated = updateExtractedValueAttributes(extractedValueId, {
            title: "Two hours before appointment",
            remind_at: "2026-08-14T08:00:00+10:00",
        });

        expect(updated).toBe(true);

        const value = EXTRACTED_VALUE_SEEDS.find((item) => item.id === extractedValueId);
        expect(value?.title).toBe("Two hours before appointment");
        expect(value?.reviewState).toBe("edited");
        expect(value?.fields.remind_at).toBe("2026-08-14T08:00:00+10:00");

        const event = TIMELINE_EVENT_SEEDS.find(
            (item) => item.extractedValueId === extractedValueId,
        );
        expect(event?.title).toBe("Two hours before appointment");
        expect(event?.reviewState).toBe("edited");

        const voiceLog = VOICE_LOG_SEEDS.find((log) => log.captureId === captureId);
        expect(voiceLog?.extractionPayload?.reminders).toEqual([
            {
                title: "Two hours before appointment",
                aspect: "admin",
                remind_at: "2026-08-14T08:00:00+10:00",
            },
        ]);
    });
});
