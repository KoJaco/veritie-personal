import { buildAuthHeaders } from "../auth";
import {
    describeUnknownError,
    VeritieSDKError,
    normalizeThrownError,
} from "../errors";
import type {
    CanonicalAudioState,
    FetchLike,
    IngestMode,
    IntegrityState,
    JobDetailResponse,
    JobEventType,
    JobSnapshotEvent,
    JobStatus,
    JobStreamEventPayload,
    JobStreamSubscription,
    ProcessingState,
    RuntimeState,
    StreamEvent,
    StreamJobOptions,
    VeritieClientConfig,
} from "../types";

const SHOW_SDK_DEBUG_LOGS =
    typeof process === "undefined" || process.env.NODE_ENV !== "production";

const DEFAULT_TOOL_SUGGESTION_SKIP_REASON = "toolsets_disabled";
const DEFAULT_INDEXING_SKIP_REASON = "not_configured";

type RuntimeNormalizationInput = {
    runtime?: Partial<RuntimeState>;
    status?: JobStatus;
    ingest_mode?: IngestMode;
    stream_session_id?: string;
    canonical_audio_state?: CanonicalAudioState;
    integrity_state?: IntegrityState;
    transcript_state?: ProcessingState;
    extraction_state?: ProcessingState;
    tool_suggestion_state?: ProcessingState;
    indexing_state?: ProcessingState;
    extraction_skip_reason?: string;
    tool_suggestion_skip_reason?: string;
    background_processing?: boolean;
    transcript_ready?: boolean;
    audio_persisted?: boolean;
    transcript?: JobDetailResponse["transcript"];
    extraction?: JobDetailResponse["extraction"];
    index?: JobDetailResponse["index"];
    tool_suggestions?: JobDetailResponse["tool_suggestions"];
};

function isTerminalLifecycleEvent(event: string): boolean {
    return (
        event === "completed" ||
        event === "partial_success" ||
        event === "failed" ||
        event === "cancelled"
    );
}

function parseStreamEvent(rawEvent: {
    id?: string;
    event: string;
    data: string;
}): StreamEvent {
    if (rawEvent.event === "job.snapshot") {
        const snapshot = JSON.parse(rawEvent.data) as Partial<JobSnapshotEvent>;
        const normalized = normalizeRuntimeCompatibilityState(snapshot);
        return {
            id: rawEvent.id,
            event: "job.snapshot",
            data: {
                job_id: snapshot.job_id ?? "",
                status: snapshot.status ?? "queued",
                rerun_of_job_id: snapshot.rerun_of_job_id,
                terminal: snapshot.terminal ?? false,
                last_event_id: snapshot.last_event_id,
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
            },
        };
    }

    return {
        id: rawEvent.id ?? "",
        event: rawEvent.event as JobEventType,
        data: JSON.parse(rawEvent.data) as JobStreamEventPayload,
    };
}

export function normalizeRuntimeCompatibilityState(
    input: RuntimeNormalizationInput,
): {
    runtime: RuntimeState;
    toolSuggestionState: ProcessingState;
    toolSuggestionSkipReason?: string;
    backgroundProcessing: boolean;
    transcriptReady: boolean;
    audioPersisted: boolean;
} {
    const ingestMode =
        input.runtime?.session_lease?.ingest_mode ??
        input.ingest_mode ??
        "batch_first";
    const transcriptStatus =
        input.runtime?.transcript?.status ??
        input.transcript_state ??
        inferProcessingState("transcript", input);
    const extractionStatus =
        input.runtime?.extraction?.status ??
        input.extraction_state ??
        inferProcessingState("extraction", input);
    const canonicalAudioState =
        input.runtime?.source_audio?.canonical_audio_state ??
        input.canonical_audio_state ??
        "pending";
    const integrityState =
        input.runtime?.source_audio?.integrity_state ??
        input.integrity_state ??
        "not_applicable";
    const streamSessionID =
        input.runtime?.session_lease?.stream_session_id ??
        input.stream_session_id;
    const toolSuggestionState =
        input.tool_suggestion_state ??
        inferProcessingState("tool_suggestion", input);
    const toolSuggestionSkipReason =
        toolSuggestionState === "skipped"
            ? input.tool_suggestion_skip_reason ??
              DEFAULT_TOOL_SUGGESTION_SKIP_REASON
            : undefined;
    const indexingStatus =
        input.runtime?.indexing?.status ??
        input.indexing_state ??
        inferIndexingState(input);
    const indexingSkipReason =
        indexingStatus === "skipped"
            ? input.runtime?.indexing?.skip_reason ??
              DEFAULT_INDEXING_SKIP_REASON
            : undefined;

    const runtime: RuntimeState = {
        overall:
            input.runtime?.overall ??
            inferOverallState(
                input.status,
                ingestMode,
                transcriptStatus,
                extractionStatus,
                canonicalAudioState,
            ),
        session_lease: {
            status:
                input.runtime?.session_lease?.status ??
                (input.status === "awaiting_upload"
                    ? "prepared"
                    : "consumed"),
            attempt_count:
                input.runtime?.session_lease?.attempt_count ?? 1,
            lease_version:
                input.runtime?.session_lease?.lease_version ?? "v0",
            ingest_mode: ingestMode,
            ...(streamSessionID ? { stream_session_id: streamSessionID } : {}),
        },
        ingest: {
            status:
                input.runtime?.ingest?.status ??
                inferIngestStatus(input.status, ingestMode),
            attempt_count:
                input.runtime?.ingest?.attempt_count ??
                (input.status === "awaiting_upload" ? 0 : 1),
            ...(input.runtime?.ingest?.skip_reason
                ? { skip_reason: input.runtime.ingest.skip_reason }
                : {}),
        },
        transcript: {
            status: transcriptStatus,
            attempt_count:
                input.runtime?.transcript?.attempt_count ??
                (transcriptStatus === "pending" ? 0 : 1),
            ...(input.runtime?.transcript?.skip_reason
                ? { skip_reason: input.runtime.transcript.skip_reason }
                : {}),
        },
        extraction: {
            status: extractionStatus,
            attempt_count:
                input.runtime?.extraction?.attempt_count ??
                (extractionStatus === "pending" ||
                extractionStatus === "skipped"
                    ? 0
                    : 1),
            ...(input.runtime?.extraction?.skip_reason ??
            input.extraction_skip_reason
                ? {
                      skip_reason:
                          input.runtime?.extraction?.skip_reason ??
                          input.extraction_skip_reason,
                  }
                : {}),
        },
        source_audio: {
            status:
                input.runtime?.source_audio?.status ??
                inferSourceAudioStatus(
                    ingestMode,
                    input.status,
                    canonicalAudioState,
                ),
            attempt_count:
                input.runtime?.source_audio?.attempt_count ??
                (canonicalAudioState === "pending" ? 0 : 1),
            canonical_audio_state: canonicalAudioState,
            integrity_state: integrityState,
        },
        indexing: {
            status: indexingStatus,
            attempt_count:
                input.runtime?.indexing?.attempt_count ??
                (indexingStatus === "pending" || indexingStatus === "skipped"
                    ? 0
                    : 1),
            ...(indexingSkipReason ? { skip_reason: indexingSkipReason } : {}),
        },
        sink_deliveries: {
            status: input.runtime?.sink_deliveries?.status ?? "skipped",
            attempt_count:
                input.runtime?.sink_deliveries?.attempt_count ?? 0,
            ...(input.runtime?.sink_deliveries?.skip_reason
                ? {
                      skip_reason:
                          input.runtime.sink_deliveries.skip_reason,
                  }
                : { skip_reason: "not_configured" }),
            ...(input.runtime?.sink_deliveries?.failure_policy
                ? {
                      failure_policy:
                          input.runtime.sink_deliveries.failure_policy,
                  }
                : { failure_policy: "non_blocking" }),
        },
    };

    return {
        runtime,
        toolSuggestionState,
        toolSuggestionSkipReason,
        backgroundProcessing:
            input.background_processing ??
            inferBackgroundProcessing(runtime),
        transcriptReady:
            input.transcript_ready ??
            (runtime.transcript.status === "completed" ||
                Boolean(input.transcript)),
        audioPersisted:
            input.audio_persisted ??
            (runtime.source_audio.canonical_audio_state === "completed" ||
                (ingestMode === "batch_first" &&
                    input.status !== undefined &&
                    input.status !== "awaiting_upload")),
    };
}

function inferProcessingState(
    stage: "transcript" | "extraction" | "tool_suggestion",
    input: RuntimeNormalizationInput,
): ProcessingState {
    if (stage === "transcript" && input.transcript) {
        return "completed";
    }
    if (stage === "extraction" && input.extraction) {
        return "completed";
    }
    if (stage === "tool_suggestion" && input.tool_suggestions?.length) {
        return "completed";
    }
    if (stage === "tool_suggestion") {
        return "skipped";
    }
    return "pending";
}

function inferIndexingState(input: RuntimeNormalizationInput): ProcessingState {
    if (input.index?.status === "failed") {
        return "failed";
    }
    if (
        input.index?.status === "completed" ||
        (input.index?.entries?.length ?? 0) > 0
    ) {
        return "completed";
    }
    return "skipped";
}

function inferBackgroundProcessing(
    runtime: RuntimeState,
): boolean {
    return runtime.transcript.status === "completed" && (
        runtime.extraction.status === "pending" ||
        runtime.extraction.status === "running" ||
        runtime.source_audio.status === "pending" ||
        runtime.source_audio.status === "running" ||
        runtime.indexing.status === "pending" ||
        runtime.indexing.status === "running" ||
        runtime.sink_deliveries.status === "pending" ||
        runtime.sink_deliveries.status === "running"
    );
}

function inferOverallState(
    status: JobStatus | undefined,
    ingestMode: IngestMode,
    transcriptStatus: ProcessingState,
    extractionStatus: ProcessingState,
    canonicalAudioState: CanonicalAudioState,
): RuntimeState["overall"] {
    switch (status) {
        case "completed":
        case "partial_success":
            return "completed";
        case "failed":
            return "failed";
        case "cancelled":
            return "cancelled";
        case "awaiting_upload":
            return ingestMode === "live_first" ? "capturing" : "ready";
    }
    if (transcriptStatus === "running" || status === "queued") {
        return "transcribing";
    }
    if (
        transcriptStatus === "completed" &&
        (extractionStatus === "pending" || extractionStatus === "running")
    ) {
        return "extracting";
    }
    if (transcriptStatus === "completed" || canonicalAudioState === "uploading") {
        return "finalizing";
    }
    return "preparing";
}

function inferIngestStatus(
    status: JobStatus | undefined,
    ingestMode: IngestMode,
): ProcessingState {
    if (status === "awaiting_upload") {
        return ingestMode === "live_first" ? "running" : "pending";
    }
    return "completed";
}

function inferSourceAudioStatus(
    ingestMode: IngestMode,
    status: JobStatus | undefined,
    canonicalAudioState: CanonicalAudioState,
): ProcessingState {
    if (canonicalAudioState === "completed") {
        return "completed";
    }
    if (canonicalAudioState === "failed") {
        return "failed";
    }
    if (canonicalAudioState === "uploading") {
        return "running";
    }
    if (status === "awaiting_upload") {
        return ingestMode === "live_first" ? "running" : "pending";
    }
    return "running";
}

class FetchJobStreamSubscription implements JobStreamSubscription {
    private currentLastEventId?: string;
    private isClosed = false;

    constructor(
        private readonly controller: AbortController,
        readonly completed: Promise<void>,
    ) {}

    get closed(): boolean {
        return this.isClosed;
    }

    get lastEventId(): string | undefined {
        return this.currentLastEventId;
    }

    setLastEventId(value?: string): void {
        this.currentLastEventId = value;
    }

    markClosed(): void {
        this.isClosed = true;
    }

    close(): void {
        if (this.isClosed) {
            return;
        }
        this.isClosed = true;
        this.controller.abort();
    }
}

export class SSETransport {
    private readonly fetchImpl: FetchLike;
    private readonly config: VeritieClientConfig;

    constructor(config: VeritieClientConfig) {
        this.fetchImpl = config.fetch ?? fetch;
        this.config = config;
    }

    async open(
        path: string,
        options: StreamJobOptions = {},
    ): Promise<JobStreamSubscription> {
        const controller = new AbortController();
        let resolveCompleted!: () => void;
        let rejectCompleted!: (error: unknown) => void;
        const completed = new Promise<void>((resolve, reject) => {
            resolveCompleted = resolve;
            rejectCompleted = reject;
        });
        const subscription = new FetchJobStreamSubscription(
            controller,
            completed,
        );

        if (options.signal) {
            if (options.signal.aborted) {
                subscription.close();
            } else {
                options.signal.addEventListener(
                    "abort",
                    () => subscription.close(),
                    { once: true },
                );
            }
        }

        void this.consume(path, controller, subscription, options).then(
            resolveCompleted,
            rejectCompleted,
        );

        return subscription;
    }

    private async consume(
        path: string,
        controller: AbortController,
        subscription: FetchJobStreamSubscription,
        options: StreamJobOptions,
    ): Promise<void> {
        const headers = await buildAuthHeaders(this.config, {
            headers: {
                Accept: "text/event-stream",
                ...(options.lastEventId
                    ? { "Last-Event-ID": options.lastEventId }
                    : {}),
            },
            pipelineAlias: options.pipelineAlias,
        });

        let response: Response;
        try {
            response = await this.fetchImpl(
                `${this.config.baseUrl.replace(/\/+$/, "")}${path}`,
                {
                    method: "GET",
                    headers,
                    signal: controller.signal,
                },
            );
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }
            logSSEDebug("error", "[veritie-sdk:sse] stream open failed", {
                path,
                baseUrl: this.config.baseUrl,
                signalAborted: controller.signal.aborted,
                lastEventId: options.lastEventId ?? null,
                error: describeUnknownError(error),
            });
            const normalized = normalizeThrownError(
                error,
                "stream_open_failed",
            );
            options.onError?.(normalized);
            throw normalized;
        }

        if (!response.ok) {
            const message = await response.text().catch(() => "");
            const error = new VeritieSDKError({
                code: "stream_open_failed",
                message:
                    message ||
                    `SSE request failed with status ${response.status}`,
                status: response.status,
            });
            options.onError?.(error);
            throw error;
        }

        if (!response.body) {
            const error = new VeritieSDKError({
                code: "stream_body_missing",
                message: "SSE response did not include a response body",
            });
            options.onError?.(error);
            throw error;
        }

        options.onOpen?.();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamClosed = false;
        let sawTerminalEvent = false;
        let sawTerminalSnapshot = false;
        let sawStreamActivity = false;

        try {
            while (!streamClosed) {
                const { done, value } = await reader.read();
                if (done) {
                    streamClosed = true;
                    break;
                }

                sawStreamActivity = true;
                buffer += decoder.decode(value, { stream: true });
                const frames = buffer.split(/\n\n/);
                buffer = frames.pop() ?? "";

                for (const frame of frames) {
                    const trimmed = frame.trim();
                    if (!trimmed) {
                        continue;
                    }

                    const parsed = parseSSEFrame(frame);
                    if (!parsed) {
                        continue;
                    }

                    if (parsed.id) {
                        subscription.setLastEventId(parsed.id);
                    }

                    const event = parseStreamEvent(parsed);
                    options.onEvent?.(event);

                    if (event.id) {
                        subscription.setLastEventId(event.id);
                    }

                    if (event.event === "job.snapshot" && event.data.terminal) {
                        sawTerminalSnapshot = true;
                    }

                    if (
                        event.event !== "job.snapshot" &&
                        isTerminalLifecycleEvent(event.event)
                    ) {
                        sawTerminalEvent = true;
                        // The server closes after terminal events. Stop local consumption too.
                        controller.abort();
                        return;
                    }
                }
            }
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }
            const recoverableDisconnect =
                sawStreamActivity && isRecoverableStreamDisconnect(error);
            logSSEDebug("warn", "[veritie-sdk:sse] stream read threw", {
                path,
                baseUrl: this.config.baseUrl,
                signalAborted: controller.signal.aborted,
                lastEventId: subscription.lastEventId ?? null,
                sawStreamActivity,
                sawTerminalEvent,
                sawTerminalSnapshot,
                recoverableDisconnect,
                error: describeUnknownError(error),
            });
            if (
                sawTerminalEvent ||
                sawTerminalSnapshot ||
                recoverableDisconnect
            ) {
                logSSEDebug(
                    "warn",
                    "[veritie-sdk:sse] suppressing recoverable stream read failure",
                    {
                        path,
                        lastEventId: subscription.lastEventId ?? null,
                        sawStreamActivity,
                        sawTerminalEvent,
                        sawTerminalSnapshot,
                        error: describeUnknownError(error),
                    },
                );
                return;
            }
            const normalized = normalizeThrownError(
                error,
                "stream_read_failed",
            );
            options.onError?.(normalized);
            throw normalized;
        } finally {
            subscription.markClosed();
            controller.abort();
        }
    }
}

function logSSEDebug(
    level: "warn" | "error",
    message: string,
    details: Record<string, unknown>,
) {
    if (!SHOW_SDK_DEBUG_LOGS) {
        return;
    }

    console[level](message, details);
}

function isRecoverableStreamDisconnect(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.trim().toLowerCase();
    return (
        error.name === "TypeError" &&
        (message === "network error" ||
            message === "failed to fetch" ||
            message.includes("network") ||
            message.includes("fetch"))
    );
}

function parseSSEFrame(
    frame: string,
): { id?: string; event: string; data: string } | null {
    let id: string | undefined;
    let event = "message";
    const dataLines: string[] = [];

    for (const line of frame.split(/\r?\n/)) {
        if (!line || line.startsWith(":")) {
            continue;
        }

        const separator = line.indexOf(":");
        const field = separator >= 0 ? line.slice(0, separator) : line;
        const value =
            separator >= 0 ? line.slice(separator + 1).trimStart() : "";

        switch (field) {
            case "id":
                id = value;
                break;
            case "event":
                event = value;
                break;
            case "data":
                dataLines.push(value);
                break;
            default:
                break;
        }
    }

    if (dataLines.length === 0) {
        return null;
    }

    return {
        id,
        event,
        data: dataLines.join("\n"),
    };
}

export { parseSSEFrame, parseStreamEvent };
