import { describe, expect, it } from "vitest";

import { normalizeRuntimeCompatibilityState, parseSSEFrame, parseStreamEvent } from "./sse";

describe("SSE parsing", () => {
  it("parses lifecycle frames", () => {
    const frame = parseSSEFrame(
      "id: cursor-1\nevent: transcription_started\ndata: {\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:00:00Z\",\"level\":\"info\",\"progress\":0}\n",
    );

    expect(frame).toEqual({
      id: "cursor-1",
      event: "transcription_started",
      data: "{\"job_id\":\"job-1\",\"timestamp\":\"2026-03-17T00:00:00Z\",\"level\":\"info\",\"progress\":0}",
    });
  });

  it("ignores heartbeat-only frames", () => {
    expect(parseSSEFrame(": keepalive")).toBeNull();
  });

  it("parses snapshot events distinctly", () => {
    const event = parseStreamEvent({
      event: "job.snapshot",
      data: "{\"job_id\":\"job-1\",\"status\":\"completed\",\"terminal\":true,\"last_event_id\":\"cursor-3\"}",
    });

    expect(event.event).toBe("job.snapshot");
    expect(event.data).toMatchObject({
      status: "completed",
      terminal: true,
    });
  });

  it("does not inject tool skip reason for non-skipped snapshot state", () => {
    const event = parseStreamEvent({
      event: "job.snapshot",
      data: "{\"job_id\":\"job-1\",\"status\":\"failed\",\"terminal\":true,\"tool_suggestion_state\":\"failed\"}",
    });

    expect(event.event).toBe("job.snapshot");
    if (event.event !== "job.snapshot") {
      throw new Error("expected snapshot event");
    }
    expect(event.data.tool_suggestion_state).toBe("failed");
    expect(event.data.tool_suggestion_skip_reason).toBeUndefined();
  });

  it("parses indexing lifecycle events", () => {
    const event = parseStreamEvent({
      id: "cursor-5",
      event: "indexing_completed",
      data: "{\"job_id\":\"job-1\",\"timestamp\":\"2026-06-22T00:00:00Z\",\"level\":\"info\",\"progress\":1}",
    });

    expect(event.event).toBe("indexing_completed");
  });

  it("derives completed indexing state from index artifact without skip reason", () => {
    const normalized = normalizeRuntimeCompatibilityState({
      status: "partial_success",
      indexing_state: "completed",
      index: {
        status: "completed",
        builder_version: "v1",
        entries: [],
      },
      runtime: {
        overall: "completed",
        session_lease: {
          status: "consumed",
          attempt_count: 1,
          lease_version: "v0",
          ingest_mode: "batch_first",
        },
        ingest: { status: "completed", attempt_count: 1 },
        transcript: { status: "completed", attempt_count: 1 },
        extraction: { status: "completed", attempt_count: 1 },
        source_audio: {
          status: "completed",
          attempt_count: 1,
          canonical_audio_state: "completed",
          integrity_state: "not_applicable",
        },
        indexing: { status: "completed", attempt_count: 1 },
        sink_deliveries: {
          status: "skipped",
          attempt_count: 0,
          skip_reason: "not_configured",
          failure_policy: "non_blocking",
        },
      },
    });

    expect(normalized.runtime.indexing.status).toBe("completed");
    expect(normalized.runtime.indexing.skip_reason).toBeUndefined();
  });

  it("keeps legacy skipped indexing with not_configured reason", () => {
    const normalized = normalizeRuntimeCompatibilityState({
      status: "completed",
      indexing_state: "skipped",
    });

    expect(normalized.runtime.indexing.status).toBe("skipped");
    expect(normalized.runtime.indexing.skip_reason).toBe("not_configured");
  });
});
