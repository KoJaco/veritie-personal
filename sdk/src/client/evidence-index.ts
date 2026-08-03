import { VeritieSDKError } from "../errors";
import type {
  EvidenceIndexArtifact,
  EvidenceIndexEntry,
  JobDetailResponse,
  JobEventType,
  JobSnapshotEvent,
  JobStatus,
  StreamLifecycleEvent,
} from "../types";

export const JOB_DETAIL_REFRESH_EVENTS: readonly JobEventType[] = [
  "transcription_completed",
  "extraction_completed",
  "indexing_completed",
  "indexing_failed",
  "tool_suggestion_completed",
  "completed",
  "partial_success",
  "failed",
  "cancelled",
];

export function isJobDetailRefreshEvent(event: JobEventType): boolean {
  return (JOB_DETAIL_REFRESH_EVENTS as readonly string[]).includes(event);
}

export function jobDetailRefreshKey(event: StreamLifecycleEvent): string {
  return `${event.id ?? event.event}:${event.data.timestamp ?? ""}`;
}

export function jobSnapshotRefreshKey(snapshot: JobSnapshotEvent): string {
  return [
    snapshot.last_event_id ?? "",
    snapshot.status ?? "",
    snapshot.transcript_ready ? "1" : "0",
    snapshot.background_processing ? "1" : "0",
    snapshot.transcript_state,
    snapshot.extraction_state,
    snapshot.tool_suggestion_state,
    snapshot.indexing_state,
    snapshot.canonical_audio_state,
  ].join(":");
}

export function shouldRefreshFromSnapshot(snapshot: JobSnapshotEvent): boolean {
  if (snapshot.terminal) {
    return true;
  }
  return (
    snapshot.background_processing ||
    snapshot.indexing_state === "pending" ||
    snapshot.indexing_state === "running" ||
    snapshot.indexing_state === "completed" ||
    snapshot.indexing_state === "failed"
  );
}

function isTerminalJobStatus(status: JobStatus): boolean {
  return (
    status === "completed" ||
    status === "partial_success" ||
    status === "failed" ||
    status === "cancelled"
  );
}

export function hasPendingJobEnrichment(detail: JobDetailResponse): boolean {
  if (!isTerminalJobStatus(detail.status)) {
    return true;
  }

  if (detail.background_processing) {
    return true;
  }

  if (
    detail.extraction_state === "pending" ||
    detail.extraction_state === "running" ||
    detail.tool_suggestion_state === "pending" ||
    detail.tool_suggestion_state === "running" ||
    detail.indexing_state === "pending" ||
    detail.indexing_state === "running" ||
    detail.runtime?.source_audio.status === "pending" ||
    detail.runtime?.source_audio.status === "running"
  ) {
    return true;
  }

  if (detail.extraction_state === "completed" && !detail.extraction) {
    return true;
  }

  if (detail.indexing_state === "completed" && !detail.index) {
    return true;
  }

  return false;
}

export function normalizeEvidenceIndex(
  raw: unknown,
): EvidenceIndexArtifact | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (typeof raw !== "object") {
    throw invalidEvidenceIndex("index must be an object");
  }

  const value = raw as Record<string, unknown>;
  const status = value.status;
  if (status !== "completed" && status !== "failed") {
    throw invalidEvidenceIndex("index.status must be completed or failed");
  }

  const builderVersion = value.builder_version;
  if (typeof builderVersion !== "string" || builderVersion.trim() === "") {
    throw invalidEvidenceIndex("index.builder_version is required");
  }

  const entriesRaw = value.entries;
  if (entriesRaw === undefined) {
    throw invalidEvidenceIndex("index.entries is required");
  }
  if (!Array.isArray(entriesRaw)) {
    throw invalidEvidenceIndex("index.entries must be an array");
  }

  const entries = entriesRaw.map((entry, index) =>
    normalizeEvidenceIndexEntry(entry, index),
  );

  const artifact: EvidenceIndexArtifact = {
    status,
    builder_version: builderVersion,
    entries,
  };

  if (typeof value.error_class === "string" && value.error_class.trim() !== "") {
    artifact.error_class = value.error_class;
  }

  logRawEvidenceIndexDebug("normalize", raw, artifact);

  return artifact;
}

export function logRawEvidenceIndexDebug(
  source: string,
  raw: unknown,
  normalized?: EvidenceIndexArtifact,
) {
  if (typeof console === "undefined") {
    return;
  }

  const isProduction =
    typeof process !== "undefined" && process.env?.NODE_ENV === "production";
  if (isProduction) {
    return;
  }

  console.debug(`[veritie-sdk:evidence-index:${source}]`, {
    raw,
    normalized: normalized ?? null,
  });
}

function normalizeEvidenceIndexEntry(
  raw: unknown,
  index: number,
): EvidenceIndexEntry {
  if (typeof raw !== "object" || raw === null) {
    throw invalidEvidenceIndex(`index.entries[${index}] must be an object`);
  }

  const value = raw as Record<string, unknown>;
  const path = value.path;
  if (typeof path !== "string" || path.length === 0 || path[0] !== "/") {
    throw invalidEvidenceIndex(
      `index.entries[${index}].path must be a non-root RFC 6901 pointer`,
    );
  }

  const status = value.status;
  if (typeof status !== "string" || status.trim() === "") {
    throw invalidEvidenceIndex(`index.entries[${index}].status is required`);
  }

  const segmentIds = normalizeSegmentIds(value.segment_ids, index);
  const entry: EvidenceIndexEntry = {
    path,
    status,
    segment_ids: segmentIds,
  };

  if (typeof value.quote === "string" && value.quote.trim() !== "") {
    entry.quote = value.quote;
  }

  if (value.start_ms !== undefined && value.start_ms !== null) {
    entry.start_ms = normalizeTimestamp(value.start_ms, index, "start_ms");
  }
  if (value.end_ms !== undefined && value.end_ms !== null) {
    entry.end_ms = normalizeTimestamp(value.end_ms, index, "end_ms");
  }

  if (
    entry.start_ms !== undefined &&
    entry.end_ms !== undefined &&
    entry.end_ms < entry.start_ms
  ) {
    throw invalidEvidenceIndex(
      `index.entries[${index}] has end_ms before start_ms`,
    );
  }

  if (typeof value.match_method === "string" && value.match_method.trim() !== "") {
    entry.match_method = value.match_method;
  }
  if (typeof value.confidence === "number" && Number.isFinite(value.confidence)) {
    entry.confidence = value.confidence;
  }
  if (
    typeof value.unresolved_reason === "string" &&
    value.unresolved_reason.trim() !== ""
  ) {
    entry.unresolved_reason = value.unresolved_reason;
  }

  if (
    (status === "matched" || status === "low_confidence") &&
    segmentIds.length === 0
  ) {
    throw invalidEvidenceIndex(
      `index.entries[${index}] matched entries require segment_ids`,
    );
  }

  return entry;
}

function normalizeSegmentIds(raw: unknown, index: number): string[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw invalidEvidenceIndex(`index.entries[${index}].segment_ids must be an array`);
  }
  return raw.map((item, segmentIndex) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw invalidEvidenceIndex(
        `index.entries[${index}].segment_ids[${segmentIndex}] must be a non-empty string`,
      );
    }
    return item;
  });
}

function normalizeTimestamp(
  raw: unknown,
  index: number,
  field: "start_ms" | "end_ms",
): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    throw invalidEvidenceIndex(
      `index.entries[${index}].${field} must be a non-negative number`,
    );
  }
  return raw;
}

function invalidEvidenceIndex(message: string): VeritieSDKError {
  return new VeritieSDKError({
    code: "invalid_evidence_index",
    message,
  });
}
