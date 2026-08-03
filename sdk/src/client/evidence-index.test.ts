import { describe, expect, it } from "vitest";

import { VeritieSDKError } from "../errors";
import {
  hasPendingJobEnrichment,
  isJobDetailRefreshEvent,
  jobDetailRefreshKey,
  normalizeEvidenceIndex,
} from "./evidence-index";
import type { JobDetailResponse, StreamLifecycleEvent } from "../types";

describe("evidence-index helpers", () => {
  it("treats indexing completion and failure as refresh events", () => {
    expect(isJobDetailRefreshEvent("indexing_completed")).toBe(true);
    expect(isJobDetailRefreshEvent("indexing_failed")).toBe(true);
    expect(isJobDetailRefreshEvent("indexing_started")).toBe(false);
  });

  it("builds stable refresh keys from lifecycle events", () => {
    const event: StreamLifecycleEvent = {
      id: "cursor-9",
      event: "indexing_completed",
      data: {
        job_id: "job-1",
        timestamp: "2026-06-22T00:00:00Z",
        level: "info",
        progress: 1,
      },
    };
    expect(jobDetailRefreshKey(event)).toBe(
      "cursor-9:2026-06-22T00:00:00Z",
    );
  });

  it("normalizes completed indexes with matched and unresolved entries", () => {
    const artifact = normalizeEvidenceIndex({
      status: "completed",
      builder_version: "v1",
      entries: [
        {
          path: "/name",
          status: "matched",
          quote: "alpha",
          segment_ids: ["550e8400-e29b-41d4-a716-446655440000"],
          start_ms: 10,
          end_ms: 20,
          match_method: "exact",
          confidence: 1,
        },
        {
          path: "/missing",
          status: "unresolved",
          segment_ids: [],
          unresolved_reason: "no_match",
        },
      ],
    });

    expect(artifact).toMatchObject({
      status: "completed",
      builder_version: "v1",
      entries: [
        expect.objectContaining({ path: "/name", status: "matched" }),
        expect.objectContaining({ path: "/missing", status: "unresolved" }),
      ],
    });
  });

  it("preserves unknown entry status strings", () => {
    const artifact = normalizeEvidenceIndex({
      status: "completed",
      builder_version: "v1",
      entries: [
        {
          path: "/future",
          status: "future_status",
          segment_ids: [],
        },
      ],
    });

    expect(artifact?.entries[0]?.status).toBe("future_status");
  });

  it("rejects malformed evidence index wire data", () => {
    expect(() =>
      normalizeEvidenceIndex({
        status: "completed",
        builder_version: "v1",
        entries: [{ path: "bad", status: "matched", segment_ids: ["id"] }],
      }),
    ).toThrowError(VeritieSDKError);

    expect(() =>
      normalizeEvidenceIndex({
        status: "completed",
        builder_version: "v1",
        entries: [
          {
            path: "/name",
            status: "matched",
            segment_ids: ["id"],
            start_ms: 20,
            end_ms: 10,
          },
        ],
      }),
    ).toThrowError(VeritieSDKError);
  });

  it("detects pending enrichment when indexing completed but index absent", () => {
    const detail = {
      job_id: "job-1",
      status: "partial_success",
      accepted_request: { audio_content_type: "audio/wav" },
      events: [],
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
      ingest_mode: "batch_first",
      canonical_audio_state: "completed",
      integrity_state: "not_applicable",
      transcript_state: "completed",
      extraction_state: "completed",
      tool_suggestion_state: "skipped",
      indexing_state: "completed",
      background_processing: false,
      transcript_ready: true,
      extraction: { payload: { name: "alpha" } },
      audio_persisted: true,
    } satisfies JobDetailResponse;

    expect(hasPendingJobEnrichment(detail)).toBe(true);
  });
});
