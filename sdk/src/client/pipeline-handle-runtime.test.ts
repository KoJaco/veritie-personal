import { describe, expect, it } from "vitest";

import {
  buildPreparedHandleSnapshot,
  reducePreparedHandleRuntimeFromEvent,
} from "./pipeline-handle-runtime";
import type { StreamLifecycleEvent } from "../types";

const bootstrap = {
  job_id: "job-1",
  status: "awaiting_upload" as const,
  status_url: "/v1/jobs/job-1",
  stream_url: "/v1/jobs/job-1/stream",
  upload: {
    method: "PUT",
    url: "https://upload.example.test/put",
    audio_uri: "supabase://audio/jobs/job-1/source",
  },
};

function lifecycleEvent(
  event: StreamLifecycleEvent["event"],
): StreamLifecycleEvent {
  return {
    id: "cursor-1",
    event,
    data: {
      job_id: "job-1",
      timestamp: "2026-06-22T00:00:00Z",
      level: "info",
      progress: 0,
    },
  };
}

describe("pipeline handle indexing runtime reductions", () => {
  it("marks indexing started as running", () => {
    const snapshot = buildPreparedHandleSnapshot("upload", "batch_only", bootstrap);
    const runtime = reducePreparedHandleRuntimeFromEvent(
      snapshot.runtime,
      lifecycleEvent("indexing_started"),
      "upload",
    );

    expect(runtime.indexing.status).toBe("running");
    expect(runtime.overall).toBe("finalizing");
  });

  it("marks indexing completed as completed", () => {
    const snapshot = buildPreparedHandleSnapshot("upload", "batch_only", bootstrap);
    const runtime = reducePreparedHandleRuntimeFromEvent(
      snapshot.runtime,
      lifecycleEvent("indexing_completed"),
      "upload",
    );

    expect(runtime.indexing.status).toBe("completed");
    expect(runtime.overall).toBe("finalizing");
  });

  it("marks indexing failed as failed without failing overall transport state", () => {
    const snapshot = buildPreparedHandleSnapshot("upload", "batch_only", bootstrap);
    const runtime = reducePreparedHandleRuntimeFromEvent(
      snapshot.runtime,
      lifecycleEvent("indexing_failed"),
      "upload",
    );

    expect(runtime.indexing.status).toBe("failed");
    expect(runtime.overall).toBe("finalizing");
  });
});
