import { describe, expect, it } from "@jest/globals";
import type { JobDetailResponse } from "@veritie/sdk";

import {
    isTranscriptPending,
    isTranscriptReady,
} from "@/lib/capture/transcript-readiness";

function makeJob(
    overrides: Partial<JobDetailResponse> = {},
): JobDetailResponse {
    return {
        job_id: "job_1",
        status: "running",
        accepted_request: { audio_content_type: "audio/webm" },
        events: [],
        runtime: {} as JobDetailResponse["runtime"],
        ingest_mode: "live_first",
        canonical_audio_state: "pending",
        integrity_state: "not_applicable",
        transcript_state: "running",
        extraction_state: "pending",
        tool_suggestion_state: "skipped",
        indexing_state: "pending",
        background_processing: true,
        transcript_ready: false,
        audio_persisted: false,
        ...overrides,
    };
}

describe("lib/capture/transcript-readiness", () => {
    it("is ready when transcript text is present", () => {
        const job = makeJob({
            transcript_ready: false,
            transcript: { text: "  Hello world  " },
        });

        expect(isTranscriptReady(job)).toBe(true);
        expect(isTranscriptPending(job)).toBe(false);
    });

    it("is ready when transcript_ready flag and text are both set", () => {
        const job = makeJob({
            transcript_ready: true,
            transcript: { text: "Done" },
        });

        expect(isTranscriptReady(job)).toBe(true);
    });

    it("is pending when transcript_ready is true but text is empty", () => {
        const job = makeJob({
            transcript_ready: true,
            transcript: { text: "   " },
        });

        expect(isTranscriptReady(job)).toBe(false);
        expect(isTranscriptPending(job)).toBe(true);
    });

    it("is pending when enrichment is running but no transcript text yet", () => {
        const job = makeJob({
            transcript_ready: false,
            extraction_state: "running",
        });

        expect(isTranscriptReady(job)).toBe(false);
        expect(isTranscriptPending(job)).toBe(true);
    });
});
