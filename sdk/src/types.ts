export type JobStatus =
    | "awaiting_upload"
    | "queued"
    | "running"
    | "completed"
    | "partial_success"
    | "failed"
    | "cancelled";

export type JobEventType =
    | "accepted"
    | "upload_ready"
    | "upload_verified"
    | "ingest_started"
    | "ingest_completed"
    | "transcription_started"
    | "transcription_completed"
    | "extraction_started"
    | "extraction_completed"
    | "indexing_started"
    | "indexing_completed"
    | "indexing_failed"
    | "tool_suggestion_started"
    | "tool_suggestion_completed"
    | "completed"
    | "partial_success"
    | "failed"
    | "cancelled"
    | "progress"
    | "processing.started"
    | "processing.completed"
    | "integrity.failed"
    | "stream.interrupted"
    | "transcript.final"
    | "transcript.partial";

export type EventLevel = "debug" | "info" | "warn" | "error";

/** Documented keys for voice capture job metadata (also accepted as opaque metadata). */
export interface CaptureJobMetadata {
    captured_at: string;
    timezone: string;
    locale: string;
    location_label?: string;
}

export interface CreateJobRequest {
    audio_content_type: string;
    audio_size_bytes?: number;
    metadata?: CaptureJobMetadata | Record<string, unknown>;
}

export interface FinalizeUploadRequest {
    audio_uri: string;
    upload_instruction_issued_at?: string;
    upload_ack_received_at?: string;
    client_upload_duration_ms?: number;
    file_size_bytes?: number;
}

export interface UploadTarget {
    method: "PUT" | string;
    url: string;
    audio_uri: string;
    required_mime_type?: string;
    issued_at?: string;
}

export interface StreamIngestBootstrap {
    session_id: string;
    websocket_url: string;
    codec: string;
    chunk_target_ms: number;
    expected_checksum_algorithm: string;
    max_duration_ms: number;
}

export interface UploadTelemetry {
    upload_instruction_issued_at?: string;
    upload_ack_received_at: string;
    client_upload_duration_ms: number;
    file_size_bytes: number;
}

export interface UploadToSignedUrlResult {
    telemetry: UploadTelemetry;
}

export interface JobResponse {
    job_id: string;
    status: JobStatus;
    rerun_of_job_id?: string;
    status_url: string;
    stream_url: string;
    audio_persisted?: boolean;
}

export interface BootstrapJobResponse extends JobResponse {
    upload: UploadTarget;
    stream_ingest?: StreamIngestBootstrap;
}

export interface AcceptedRequest {
    audio_content_type: string;
    audio_size_bytes?: number;
    metadata?: Record<string, unknown>;
}

export interface JobEvent {
    id?: string;
    type: JobEventType;
    level: EventLevel;
    message: string;
    progress: number;
    data?: Record<string, unknown>;
    created_at?: string;
}

export interface ToolSuggestion {
    tool_identifier: string;
    order_index: number;
    title?: string;
    args?: Record<string, unknown>;
    status?: string;
    confidence?: number;
}

export interface TranscriptSegment {
    index?: number;
    start_ms: number;
    end_ms: number;
    text: string;
    speaker_label?: string;
    confidence?: number;
}

export interface TranscriptArtifact {
    text: string;
    language?: string;
    duration_ms?: number;
    provider?: string;
    segments?: TranscriptSegment[];
}

export interface ExtractionArtifact {
    payload: Record<string, unknown>;
}

export type EvidenceIndexEntryStatus =
    | "matched"
    | "low_confidence"
    | "unresolved"
    | (string & {});

export type EvidenceMatchMethod =
    | "exact"
    | "fuzzy"
    | "value_fallback"
    | (string & {});

export interface EvidenceIndexEntry {
    path: string;
    status: EvidenceIndexEntryStatus;
    quote?: string;
    segment_ids: string[];
    start_ms?: number;
    end_ms?: number;
    match_method?: EvidenceMatchMethod;
    confidence?: number;
    unresolved_reason?: string;
}

export interface EvidenceIndexArtifact {
    status: "completed" | "failed";
    builder_version: string;
    entries: EvidenceIndexEntry[];
    error_class?: string;
}

export type ProcessingState = "pending" | "running" | "completed" | "failed" | "skipped";
export type IngestMode = "batch_first" | "live_first";
export type CanonicalAudioState = "pending" | "uploading" | "completed" | "failed";
export type IntegrityState = "not_applicable" | "pending" | "verified" | "failed";
export type RuntimeOverallState =
    | "preparing"
    | "ready"
    | "capturing"
    | "uploading"
    | "transcribing"
    | "extracting"
    | "finalizing"
    | "completed"
    | "failed"
    | "cancelled"
    | "expired";
export type RuntimeLeaseStatus = "prepared" | "consumed" | "expired" | "aborted";

export interface RuntimeStageState {
    status: ProcessingState;
    attempt_count: number;
    skip_reason?: string;
}

export interface RuntimeSessionLeaseState {
    status: RuntimeLeaseStatus;
    attempt_count: number;
    lease_version: string;
    ingest_mode: IngestMode;
    stream_session_id?: string;
}

export interface RuntimeSourceAudioState {
    status: ProcessingState;
    attempt_count: number;
    canonical_audio_state: CanonicalAudioState;
    integrity_state: IntegrityState;
}

export interface RuntimeSinkDeliveriesState {
    status: ProcessingState;
    attempt_count: number;
    skip_reason?: string;
    failure_policy?: string;
}

export interface RuntimeState {
    overall: RuntimeOverallState;
    session_lease: RuntimeSessionLeaseState;
    ingest: RuntimeStageState;
    transcript: RuntimeStageState;
    extraction: RuntimeStageState;
    source_audio: RuntimeSourceAudioState;
    indexing: RuntimeStageState;
    sink_deliveries: RuntimeSinkDeliveriesState;
}

export interface JobStepTrace {
    step: string;
    status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "skipped";
    message?: string;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    duration_ms?: number;
    details?: Record<string, unknown>;
}

export interface JobDetailResponse {
    job_id: string;
    status: JobStatus;
    rerun_of_job_id?: string;
    accepted_request: AcceptedRequest;
    events: JobEvent[];
    step_traces?: JobStepTrace[];
    transcript?: TranscriptArtifact;
    extraction?: ExtractionArtifact;
    index?: EvidenceIndexArtifact;
    tool_suggestions?: ToolSuggestion[];
    runtime: RuntimeState;
    ingest_mode: IngestMode;
    stream_session_id?: string;
    canonical_audio_state: CanonicalAudioState;
    integrity_state: IntegrityState;
    transcript_state: ProcessingState;
    extraction_state: ProcessingState;
    tool_suggestion_state: ProcessingState;
    indexing_state: ProcessingState;
    extraction_skip_reason?: string;
    tool_suggestion_skip_reason?: string;
    background_processing: boolean;
    transcript_ready: boolean;
    audio_persisted: boolean;
    error_message?: string;
}

export interface ErrorResponse {
    error: string;
    message: string;
    details?: unknown;
}

export interface JobStreamEventPayload {
    job_id: string;
    timestamp: string;
    level: EventLevel;
    stage?: string;
    progress: number;
    message?: string;
    payload?: Record<string, unknown>;
}

export interface JobSnapshotEvent {
    job_id: string;
    status: JobStatus;
    rerun_of_job_id?: string;
    terminal: boolean;
    last_event_id?: string;
    step_traces?: JobStepTrace[];
    runtime: RuntimeState;
    ingest_mode: IngestMode;
    stream_session_id?: string;
    canonical_audio_state: CanonicalAudioState;
    integrity_state: IntegrityState;
    transcript_state: ProcessingState;
    extraction_state: ProcessingState;
    tool_suggestion_state: ProcessingState;
    indexing_state: ProcessingState;
    extraction_skip_reason?: string;
    tool_suggestion_skip_reason?: string;
    background_processing: boolean;
    transcript_ready: boolean;
    audio_persisted: boolean;
}

export interface StreamLifecycleEvent {
    id: string;
    event: JobEventType;
    data: JobStreamEventPayload;
}

export interface StreamSnapshotEvent {
    id?: string;
    event: "job.snapshot";
    data: JobSnapshotEvent;
}

export type StreamEvent = StreamLifecycleEvent | StreamSnapshotEvent;

export interface LiveChunkMetadata {
    sequence: number;
    offset_bytes: number;
    size_bytes: number;
    chunk_sha256: string;
}

export interface LiveSessionEndRequest {
    last_sequence: number;
    total_bytes: number;
    final_checksum_sha256: string;
}

export type AuthHeaderName = "Authorization" | "X-API-Key";

export type FetchLike = typeof fetch;

export interface WebSocketLike {
    binaryType: BinaryType;
    readyState: number;
    onopen: ((event: Event) => void) | null;
    onerror: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    close(code?: number, reason?: string): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export type AuthHeadersProvider =
    | HeadersInit
    | (() => HeadersInit | Promise<HeadersInit>);

export interface VeritieClientConfig {
    baseUrl: string;
    pipelineAlias: string;
    apiKey?: string;
    apiKeyHeader?: AuthHeaderName;
    headers?: HeadersInit;
    getAuthHeaders?: () => HeadersInit | Promise<HeadersInit>;
    fetch?: FetchLike;
    webSocketFactory?: WebSocketFactory;
}

export interface PipelineDisplayConfigWarningV1 {
    code: string;
    message: string;
    requested_alias?: string;
    active_alias?: string;
    sunset_at?: string;
}

export interface PipelineDisplaySettingsV1 {
    entities_enabled: boolean;
    actions_enabled: boolean;
    action_mode: "suggest_only";
    ingest_mode: IngestMode;
}

export interface PipelineDisplayVersionedDefinitionV1 {
    id: string;
    version_id: string;
    version: number;
    definition: Record<string, unknown>;
}

export interface PipelineDisplayConfigV1 {
    version: "v1";
    app: {
        id: string;
        name: string;
        description?: string;
    };
    pipeline: {
        id: string;
        name: string;
        description?: string;
        alias: string;
        requested_alias?: string;
    };
    settings: PipelineDisplaySettingsV1;
    schema: PipelineDisplayVersionedDefinitionV1;
    glossary: PipelineDisplayVersionedDefinitionV1;
    warnings: PipelineDisplayConfigWarningV1[];
}

export interface RequestOptions {
    headers?: HeadersInit;
}

export interface AppScopedRequestOptions extends RequestOptions {
    pipelineAlias?: string;
}

export interface CreateJobOptions extends AppScopedRequestOptions {
    idempotencyKey?: string;
    signal?: AbortSignal;
}

export interface FinalizeUploadOptions extends AppScopedRequestOptions {
    signal?: AbortSignal;
}

export interface GetJobOptions extends AppScopedRequestOptions {
    signal?: AbortSignal;
}

export interface GetPipelineConfigOptions extends AppScopedRequestOptions {}

export interface RerunJobOptions extends AppScopedRequestOptions {}

export interface UploadToSignedUrlOptions extends RequestOptions {
    contentType?: string;
    signal?: AbortSignal;
}

export interface StreamJobOptions {
    pipelineAlias?: string;
    lastEventId?: string;
    signal?: AbortSignal;
    onOpen?: () => void;
    onEvent?: (event: StreamEvent) => void;
    onError?: (error: unknown) => void;
}

export interface JobStreamSubscription {
    readonly completed: Promise<void>;
    readonly closed: boolean;
    readonly lastEventId?: string;
    close(): void;
}

export interface CreateAndUploadJobOptions {
    create: CreateJobRequest;
    file: Blob;
    pipelineAlias?: string;
    idempotencyKey?: string;
    signal?: AbortSignal;
    upload?: UploadToSignedUrlOptions;
}

export interface CreateAndUploadJobResult {
    bootstrap: BootstrapJobResponse;
    job: JobResponse;
}

export interface OpenLiveSessionOptions {
    signal?: AbortSignal;
}

export interface LiveJobSession {
    readonly jobId: string;
    readonly sessionId: string;
    readonly bootstrap: StreamIngestBootstrap;
    readonly started: boolean;
    readonly closed: boolean;
    sendChunk(metadata: LiveChunkMetadata, bytes: Blob | ArrayBuffer | Uint8Array): Promise<void>;
    end(request: LiveSessionEndRequest): Promise<void>;
    close(code?: number, reason?: string): void;
}

export interface StreamLiveFileOptions {
    signal?: AbortSignal;
    chunkSizeBytes?: number;
}

export interface CreateAndStreamJobOptions {
    create: CreateJobRequest;
    file: Blob;
    pipelineAlias?: string;
    idempotencyKey?: string;
    upload?: UploadToSignedUrlOptions;
    live?: StreamLiveFileOptions;
}

export type LiveFallbackReason = "bootstrap_unavailable" | "live_open_failed";

export interface CreateAndStreamJobLiveResult {
    bootstrap: BootstrapJobResponse;
    mode: "live";
    session: LiveJobSession;
}

export interface CreateAndStreamJobBatchResult {
    bootstrap: BootstrapJobResponse;
    mode: "batch";
    job: JobResponse;
    fallback_reason: LiveFallbackReason;
    live_error_code?: string;
}

export type CreateAndStreamJobResult =
    | CreateAndStreamJobLiveResult
    | CreateAndStreamJobBatchResult;

export type TransportPolicy = "live_only" | "batch_only" | "auto";

export type PipelineHandleKind = "capture" | "upload";

export interface PrepareCaptureOptions extends CreateJobOptions {
    transportPolicy?: Extract<TransportPolicy, "live_only" | "auto">;
}

export interface PrepareUploadOptions extends CreateJobOptions {
    transportPolicy?: TransportPolicy;
}

export interface PipelineStartCaptureOptions extends OpenLiveSessionOptions {}

export interface PipelineStartUploadOptions {
    live?: StreamLiveFileOptions;
    upload?: UploadToSignedUrlOptions;
}

export interface PipelineStartUploadLiveResult {
    bootstrap: BootstrapJobResponse;
    mode: "live";
    session: LiveJobSession;
}

export interface PipelineStartUploadBatchResult {
    bootstrap: BootstrapJobResponse;
    mode: "batch";
    job: JobResponse;
    fallbackReason?: LiveFallbackReason;
    liveErrorCode?: string;
}

export type PipelineStartUploadResult =
    | PipelineStartUploadLiveResult
    | PipelineStartUploadBatchResult;

export interface PipelineSubmitAndDetachResult {
    jobId: string;
    status: JobStatus;
    statusUrl: string;
    streamUrl: string;
    audio_persisted: boolean;
    job: JobResponse;
    bootstrap: BootstrapJobResponse;
}

export type RuntimePreset = "background" | "observable" | "review" | "debug";

export interface PipelineHandleSnapshot {
    kind: PipelineHandleKind;
    transportPolicy: TransportPolicy;
    bootstrap: BootstrapJobResponse;
    jobId: string;
    streamSessionId?: string;
    leaseVersion: string;
    leaseStatus: RuntimeLeaseStatus;
    runtime: RuntimeState;
    detail: JobDetailResponse | null;
    lastEvent: StreamEvent | null;
    streamSubscription: JobStreamSubscription | null;
}

export type PipelineHandleListener = (
    snapshot: PipelineHandleSnapshot,
) => void;

export interface PipelineHandle {
    readonly snapshot: PipelineHandleSnapshot;
    startCapture(
        options?: PipelineStartCaptureOptions,
    ): Promise<LiveJobSession>;
    startUpload(
        file: Blob,
        options?: PipelineStartUploadOptions,
    ): Promise<PipelineStartUploadResult>;
    /**
     * Background preset: upload + finalize, then resolve when audio is persisted.
     * Does not open SSE or wait for transcript. Upload handles with batch_only only.
     */
    submitAndDetach(
        file: Blob,
        options?: PipelineStartUploadOptions,
    ): Promise<PipelineSubmitAndDetachResult>;
    stream(options?: StreamJobOptions): Promise<JobStreamSubscription>;
    refresh(options?: GetJobOptions): Promise<JobDetailResponse>;
    subscribe(listener: PipelineHandleListener): () => void;
    close(): void;
}
