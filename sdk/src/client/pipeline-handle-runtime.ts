import { normalizeRuntimeCompatibilityState } from "../transport/sse";
import type {
  BootstrapJobResponse,
  JobDetailResponse,
  PipelineHandleKind,
  PipelineHandleSnapshot,
  RuntimeState,
  StreamEvent,
  TransportPolicy,
} from "../types";

export function buildPreparedHandleSnapshot(
  kind: PipelineHandleKind,
  transportPolicy: TransportPolicy,
  bootstrap: BootstrapJobResponse,
): PipelineHandleSnapshot {
  const ingestMode = bootstrap.stream_ingest ? "live_first" : "batch_first";
  const streamSessionId = bootstrap.stream_ingest?.session_id;
  const runtime = createPreparedRuntimeState(kind, ingestMode, streamSessionId);
  return {
    kind,
    transportPolicy,
    bootstrap,
    jobId: bootstrap.job_id,
    streamSessionId,
    leaseVersion: runtime.session_lease.lease_version,
    leaseStatus: runtime.session_lease.status,
    runtime,
    detail: null,
    lastEvent: null,
    streamSubscription: null,
  };
}

export function markPreparedHandleRuntimeConsumed(
  runtime: RuntimeState,
  overall: RuntimeState["overall"],
): RuntimeState {
  return {
    ...runtime,
    overall,
    session_lease: {
      ...runtime.session_lease,
      status: "consumed",
    },
    ingest: {
      ...runtime.ingest,
      status: "running",
      attempt_count: Math.max(1, runtime.ingest.attempt_count),
    },
    source_audio: {
      ...runtime.source_audio,
      status:
        runtime.source_audio.status === "completed" ? "completed" : "running",
      attempt_count: Math.max(1, runtime.source_audio.attempt_count),
      canonical_audio_state:
        runtime.source_audio.canonical_audio_state === "completed"
          ? "completed"
          : runtime.session_lease.ingest_mode === "batch_first"
            ? "uploading"
            : runtime.source_audio.canonical_audio_state,
      integrity_state:
        runtime.session_lease.ingest_mode === "batch_first"
          ? runtime.source_audio.integrity_state
          : "pending",
    },
  };
}

export function markPreparedHandleLiveUploadOpened(
  runtime: RuntimeState,
  streamSessionId: string,
): RuntimeState {
  return {
    ...runtime,
    overall: "uploading",
    session_lease: {
      ...runtime.session_lease,
      stream_session_id: streamSessionId,
    },
    ingest: {
      ...runtime.ingest,
      status: "running",
      attempt_count: Math.max(1, runtime.ingest.attempt_count),
    },
    source_audio: {
      ...runtime.source_audio,
      status: "running",
      attempt_count: Math.max(1, runtime.source_audio.attempt_count),
      integrity_state: "pending",
    },
  };
}

export function markPreparedHandleRuntimeAborted(
  runtime: RuntimeState,
): RuntimeState {
  return {
    ...runtime,
    session_lease: {
      ...runtime.session_lease,
      status: "aborted",
    },
  };
}

export function reducePreparedHandleRuntimeFromEvent(
  runtime: RuntimeState,
  event: Extract<StreamEvent, { event: Exclude<StreamEvent["event"], "job.snapshot"> }>,
  kind: PipelineHandleKind,
): RuntimeState {
  switch (event.event) {
    case "upload_verified":
      return {
        ...runtime,
        overall: "transcribing",
        ingest: {
          ...runtime.ingest,
          status: "completed",
          attempt_count: Math.max(1, runtime.ingest.attempt_count),
        },
        source_audio: {
          ...runtime.source_audio,
          status: "completed",
          attempt_count: Math.max(1, runtime.source_audio.attempt_count),
          canonical_audio_state: "completed",
          integrity_state: "verified",
        },
      };
    case "ingest_started":
      return {
        ...runtime,
        overall: kind === "capture" ? "capturing" : "uploading",
        ingest: {
          ...runtime.ingest,
          status: "running",
          attempt_count: Math.max(1, runtime.ingest.attempt_count),
        },
      };
    case "ingest_completed":
      return {
        ...runtime,
        overall: "transcribing",
        ingest: {
          ...runtime.ingest,
          status: "completed",
          attempt_count: Math.max(1, runtime.ingest.attempt_count),
        },
      };
    case "transcription_started":
      return {
        ...runtime,
        overall: "transcribing",
        transcript: {
          ...runtime.transcript,
          status: "running",
          attempt_count: Math.max(1, runtime.transcript.attempt_count),
        },
      };
    case "transcription_completed":
      return {
        ...runtime,
        overall:
          runtime.extraction.status === "running" ? "extracting" : "finalizing",
        transcript: {
          ...runtime.transcript,
          status: "completed",
          attempt_count: Math.max(1, runtime.transcript.attempt_count),
        },
      };
    case "extraction_started":
      return {
        ...runtime,
        overall: "extracting",
        extraction: {
          ...runtime.extraction,
          status: "running",
          attempt_count: Math.max(1, runtime.extraction.attempt_count),
        },
      };
    case "extraction_completed":
      return {
        ...runtime,
        overall: "finalizing",
        extraction: {
          ...runtime.extraction,
          status: "completed",
          attempt_count: Math.max(1, runtime.extraction.attempt_count),
        },
      };
    case "indexing_started":
      return {
        ...runtime,
        overall: "finalizing",
        indexing: {
          status: "running",
          attempt_count: Math.max(1, runtime.indexing.attempt_count),
        },
      };
    case "indexing_completed":
      return {
        ...runtime,
        overall: "finalizing",
        indexing: {
          status: "completed",
          attempt_count: Math.max(1, runtime.indexing.attempt_count),
        },
      };
    case "indexing_failed":
      return {
        ...runtime,
        overall: "finalizing",
        indexing: {
          status: "failed",
          attempt_count: Math.max(1, runtime.indexing.attempt_count),
        },
      };
    case "completed":
    case "partial_success":
      return {
        ...runtime,
        overall: "completed",
      };
    case "failed":
      return {
        ...runtime,
        overall: "failed",
      };
    case "cancelled":
      return {
        ...runtime,
        overall: "cancelled",
      };
    default:
      return runtime;
  }
}

export function rehydratePreparedHandleDetail(
  detail: JobDetailResponse,
  runtime: RuntimeState,
): JobDetailResponse {
  const normalized = normalizeRuntimeCompatibilityState({
    ...detail,
    runtime,
  });
  return {
    ...detail,
    runtime: normalized.runtime,
    ingest_mode: normalized.runtime.session_lease.ingest_mode,
    stream_session_id: normalized.runtime.session_lease.stream_session_id,
    canonical_audio_state: normalized.runtime.source_audio.canonical_audio_state,
    integrity_state: normalized.runtime.source_audio.integrity_state,
    transcript_state: normalized.runtime.transcript.status,
    extraction_state: normalized.runtime.extraction.status,
    tool_suggestion_state: normalized.toolSuggestionState,
    indexing_state: normalized.runtime.indexing.status,
    extraction_skip_reason: normalized.runtime.extraction.skip_reason,
    tool_suggestion_skip_reason: normalized.toolSuggestionSkipReason,
    background_processing: normalized.backgroundProcessing,
    transcript_ready: normalized.transcriptReady,
    audio_persisted: normalized.audioPersisted,
  };
}

function createPreparedRuntimeState(
  _kind: PipelineHandleKind,
  ingestMode: RuntimeState["session_lease"]["ingest_mode"],
  streamSessionId?: string,
): RuntimeState {
  return {
    overall: "ready",
    session_lease: {
      status: "prepared",
      attempt_count: 1,
      lease_version: "v0",
      ingest_mode: ingestMode,
      ...(streamSessionId ? { stream_session_id: streamSessionId } : {}),
    },
    ingest: {
      status: "pending",
      attempt_count: 0,
    },
    transcript: {
      status: "pending",
      attempt_count: 0,
    },
    extraction: {
      status: "pending",
      attempt_count: 0,
    },
    source_audio: {
      status: "pending",
      attempt_count: 0,
      canonical_audio_state: "pending",
      integrity_state: "not_applicable",
    },
    indexing: {
      status: "skipped",
      attempt_count: 0,
      skip_reason: "not_configured",
    },
    sink_deliveries: {
      status: "skipped",
      attempt_count: 0,
      skip_reason: "not_configured",
      failure_policy: "non_blocking",
    },
  };
}
