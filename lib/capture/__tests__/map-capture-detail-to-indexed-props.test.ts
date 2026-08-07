import { describe, expect, it } from "@jest/globals";

import { mapCaptureDetailToIndexedProps } from "@/lib/capture/map-capture-detail-to-indexed-props";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";

function makeDetail(): CaptureDetailReadModel {
    return {
        capture: {
            id: "capture_detail",
            type: "voice",
            status: "completed",
            title: "Voice log",
            aspectIds: ["personal"],
            veritieJobId: "job_detail",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
        },
        voiceLog: {
            id: "voice_detail",
            captureId: "capture_detail",
            transcriptText: "Morning walk",
            language: "en",
            durationMs: 1200,
            audioUri: "account/user/jobs/job_detail/audio.webm",
            indexArtifact: {
                status: "completed",
                builder_version: "v1",
                entries: [
                    {
                        path: "title",
                        status: "resolved",
                        quote: "Morning walk",
                        start_ms: 0,
                        segment_ids: ["segment_capture_detail_0"],
                    },
                ],
            },
            extractionPayload: {
                title: "Walk",
                fields: { mood: "good" },
            },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
        },
        segments: [
            {
                id: "segment_capture_detail_0",
                voiceLogId: "voice_detail",
                index: 0,
                startMs: 0,
                endMs: 500,
                text: "Morning",
                confidence: 0.9,
            },
        ],
        extractedValues: [],
        sourceAnchors: [],
    };
}

describe("lib/capture/map-capture-detail-to-indexed-props", () => {
    it("maps persisted voice log artifacts and segments for indexed UI", () => {
        const props = mapCaptureDetailToIndexedProps(
            makeDetail(),
            "https://signed.example/audio",
        );

        expect(props.audioUrl).toBe("https://signed.example/audio");
        expect(props.transcript?.text).toBe("Morning walk");
        expect(props.transcript?.segments?.[0]?.id).toBe("segment_capture_detail_0");
        expect(props.extraction).toEqual({
            title: "Walk",
            fields: { mood: "good" },
        });
        expect(props.index?.entries?.length).toBe(1);
        expect(props.index?.entries?.[0]?.segment_ids).toEqual([
            "segment_capture_detail_0",
        ]);
    });

    it("defaults extraction to empty object when payload is missing", () => {
        const detail = makeDetail();
        detail.voiceLog!.extractionPayload = undefined;
        detail.voiceLog!.indexArtifact = undefined;

        const props = mapCaptureDetailToIndexedProps(detail);
        expect(props.extraction).toEqual({});
        expect(props.index).toBeNull();
    });
});
