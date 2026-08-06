import { describe, expect, it } from "@jest/globals";
import type { JobDetailResponse } from "@veritie/sdk";

import {
    buildCaptureAudioPlaybackUrl,
    mapJobToIndexedProps,
} from "@/lib/capture/map-job-to-indexed-props";

function makeJob(): JobDetailResponse {
    return {
        job_id: "job_map",
        status: "completed",
        accepted_request: { audio_content_type: "audio/webm" },
        events: [],
        runtime: {} as JobDetailResponse["runtime"],
        ingest_mode: "live_first",
        canonical_audio_state: "completed",
        integrity_state: "not_applicable",
        transcript_state: "completed",
        extraction_state: "completed",
        tool_suggestion_state: "skipped",
        indexing_state: "completed",
        background_processing: false,
        transcript_ready: true,
        audio_persisted: true,
        transcript: {
            text: "Morning walk",
            language: "en",
            duration_ms: 1200,
            segments: [
                {
                    index: 0,
                    start_ms: 0,
                    end_ms: 500,
                    text: "Morning",
                    confidence: 0.9,
                },
            ],
        },
        extraction: {
            payload: {
                title: "Walk",
                fields: { mood: "good" },
            },
        },
        index: {
            status: "completed",
            builder_version: "v1",
            entries: [
                {
                    path: "title",
                    status: "resolved",
                    quote: "Morning walk",
                    start_ms: 0,
                    segment_ids: ["segment-0"],
                },
            ],
        },
    };
}

describe("lib/capture/map-job-to-indexed-props", () => {
    it("maps transcript, extraction, and index artifacts", () => {
        const props = mapJobToIndexedProps(makeJob(), "https://audio.example/webm");

        expect(props.audioUrl).toBe("https://audio.example/webm");
        expect(props.transcript?.text).toBe("Morning walk");
        expect(props.transcript?.segments?.[0]?.text).toBe("Morning");
        expect(props.extraction).toEqual({
            title: "Walk",
            fields: { mood: "good" },
        });
        expect(props.index?.entries?.length).toBe(1);
    });

    it("defaults audioUrl to null when not provided", () => {
        const props = mapJobToIndexedProps(makeJob());
        expect(props.audioUrl).toBeNull();
    });

    it("builds capture audio playback API path", () => {
        expect(buildCaptureAudioPlaybackUrl("capture_123")).toBe(
            "/api/captures/capture_123/audio",
        );
    });
});
