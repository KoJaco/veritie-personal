import { VeritieSDKError } from "../errors";
import { HttpTransport } from "../transport/http";
import { digestSHA256Hex, LiveTransport, normalizeLiveTransportError } from "../transport/live";
import { normalizeRuntimeCompatibilityState, SSETransport } from "../transport/sse";
import {
  buildPreparedHandleSnapshot,
  markPreparedHandleLiveUploadOpened,
  markPreparedHandleRuntimeAborted,
  markPreparedHandleRuntimeConsumed,
  reducePreparedHandleRuntimeFromEvent,
  rehydratePreparedHandleDetail,
} from "./pipeline-handle-runtime";
import {
  isJobDetailRefreshEvent,
  jobDetailRefreshKey,
  jobSnapshotRefreshKey,
  logRawEvidenceIndexDebug,
  normalizeEvidenceIndex,
  shouldRefreshFromSnapshot,
} from "./evidence-index";
import type {
  BootstrapJobResponse,
  CreateAndStreamJobOptions,
  CreateAndStreamJobResult,
  CreateAndUploadJobOptions,
  CreateAndUploadJobResult,
  CreateJobOptions,
  CreateJobRequest,
  FinalizeUploadOptions,
  FinalizeUploadRequest,
  GetJobOptions,
  GetPipelineConfigOptions,
  LiveJobSession,
  JobDetailResponse,
  JobEvent,
  JobResponse,
  JobSnapshotEvent,
  JobStreamSubscription,
  OpenLiveSessionOptions,
  PipelineDisplayConfigV1,
  PipelineHandle,
  PipelineHandleListener,
  PipelineHandleSnapshot,
  PipelineHandleKind,
  PipelineStartCaptureOptions,
  PipelineStartUploadOptions,
  PipelineStartUploadResult,
  PipelineSubmitAndDetachResult,
  PrepareCaptureOptions,
  PrepareUploadOptions,
  ProcessingState,
  RerunJobOptions,
  RuntimeLeaseStatus,
  RuntimeState,
  StreamEvent,
  StreamLiveFileOptions,
  StreamJobOptions,
  TransportPolicy,
  UploadTelemetry,
  UploadTarget,
  UploadToSignedUrlOptions,
  UploadToSignedUrlResult,
  VeritieClientConfig,
} from "../types";

const DEFAULT_LIVE_CHUNK_SIZE_BYTES = 64 * 1024;

type HandleCreateContext = {
  createRequest: CreateJobRequest;
  createOptions: CreateJobOptions;
  transportPolicy: TransportPolicy;
};

interface StreamLiveFileHooks {
  onChunkSent?: (chunkCount: number) => void;
}

class PipelineHandleImpl implements PipelineHandle {
  private listeners = new Set<PipelineHandleListener>();
  private streamSubscription: JobStreamSubscription | null = null;
  private activeLiveSession: LiveJobSession | null = null;
  private hasReprepared = false;
  private isClosed = false;
  private isConsumed = false;
  private sentChunkCount = 0;
  private lastDetailRefreshKey: string | null = null;
  private lastSnapshotRefreshKey: string | null = null;
  private detailRefreshInFlight = false;
  private snapshotState: PipelineHandleSnapshot;

  constructor(
    private readonly sdk: VeritieSDK,
    private readonly kind: PipelineHandleKind,
    private readonly context: HandleCreateContext,
    bootstrap: BootstrapJobResponse,
  ) {
    this.snapshotState = buildPreparedHandleSnapshot(kind, context.transportPolicy, bootstrap);
  }

  get snapshot(): PipelineHandleSnapshot {
    return this.snapshotState;
  }

  async startCapture(options: PipelineStartCaptureOptions = {}): Promise<LiveJobSession> {
    if (this.kind !== "capture") {
      throw new VeritieSDKError({
        code: "invalid_pipeline_handle",
        message: "startCapture is only available on capture handles",
      });
    }
    this.assertActionAllowed("startCapture");

    return this.withLiveReprepare(async () => {
      const session = await this.sdk.openLiveSession(this.snapshotState.bootstrap, options);
      this.activeLiveSession = session;
      this.markConsumed("capturing", {
        streamSessionId: session.sessionId,
      });
      return session;
    }, { allowPreConsumptionRetry: true });
  }

  async startUpload(
    file: Blob,
    options: PipelineStartUploadOptions = {},
  ): Promise<PipelineStartUploadResult> {
    if (this.kind !== "upload") {
      throw new VeritieSDKError({
        code: "invalid_pipeline_handle",
        message: "startUpload is only available on upload handles",
      });
    }
    this.assertActionAllowed("startUpload");

    switch (this.context.transportPolicy) {
      case "batch_only":
        return this.startBatchUpload(file, options.upload);
      case "live_only":
        return this.startLiveUpload(file, options.live);
      case "auto":
        if (!this.snapshotState.bootstrap.stream_ingest) {
          const batch = await this.startBatchUpload(file, options.upload);
          return {
            ...batch,
            fallbackReason: "bootstrap_unavailable",
          };
        }
        try {
          return await this.startLiveUpload(file, options.live);
        } catch (error) {
          const normalized = normalizeLiveTransportError(error, "live_stream_failed");
          if (this.canFallbackToBatch(normalized)) {
            const batch = await this.startBatchUpload(file, options.upload);
            return {
              ...batch,
              fallbackReason: normalized.code === "live_unavailable" || normalized.code === "live_websocket_unavailable"
                ? "bootstrap_unavailable"
                : "live_open_failed",
              liveErrorCode: normalized.code,
            };
          }
          throw normalized;
        }
      default:
        throw new VeritieSDKError({
          code: "invalid_transport_policy",
          message: `Unsupported transport policy ${this.context.transportPolicy}`,
        });
    }
  }

  async submitAndDetach(
    file: Blob,
    options: PipelineStartUploadOptions = {},
  ): Promise<PipelineSubmitAndDetachResult> {
    if (this.kind !== "upload") {
      throw new VeritieSDKError({
        code: "invalid_pipeline_handle",
        message: "submitAndDetach is only available on upload handles",
      });
    }
    if (this.context.transportPolicy !== "batch_only") {
      throw new VeritieSDKError({
        code: "invalid_transport_policy",
        message: "submitAndDetach requires batch_only transport (background preset)",
      });
    }

    const result = await this.startUpload(file, {
      ...options,
      // Force batch path; ignore any live options for background detach.
      live: undefined,
    });
    if (result.mode !== "batch") {
      throw new VeritieSDKError({
        code: "invalid_transport_policy",
        message: "submitAndDetach requires batch upload finalize",
      });
    }

    const audioPersisted =
      result.job.audio_persisted ?? result.job.status !== "awaiting_upload";
    if (!audioPersisted) {
      throw new VeritieSDKError({
        code: "audio_not_persisted",
        message: "upload finalize did not report audio_persisted",
        details: { status: result.job.status },
      });
    }

    return {
      jobId: result.job.job_id,
      status: result.job.status,
      statusUrl: result.job.status_url,
      streamUrl: result.job.stream_url,
      audio_persisted: true,
      job: result.job,
      bootstrap: result.bootstrap,
    };
  }

  async stream(options: StreamJobOptions = {}): Promise<JobStreamSubscription> {
    this.assertActionAllowed("stream");
    this.streamSubscription?.close();
    const subscription = await this.sdk.streamJob(this.snapshotState.jobId, {
      ...options,
      onEvent: (event) => {
        this.applyStreamEvent(event);
        options.onEvent?.(event);
      },
      onError: (error) => {
        options.onError?.(error);
      },
    });
    this.streamSubscription = subscription;
    this.setSnapshot({
      streamSubscription: subscription,
    });
    void (async () => {
      try {
        await subscription.completed;
      } catch {
        // The caller owns stream failures.
      } finally {
        if (this.streamSubscription === subscription) {
          this.streamSubscription = null;
          this.setSnapshot({ streamSubscription: null });
        }
      }
    })();
    return subscription;
  }

  async refresh(options: GetJobOptions = {}): Promise<JobDetailResponse> {
    const detail = await this.sdk.getJob(this.snapshotState.jobId, {
      pipelineAlias: options.pipelineAlias ?? this.context.createOptions.pipelineAlias,
      headers: options.headers ?? this.context.createOptions.headers,
    });
    this.applyDetail(detail);
    return detail;
  }

  subscribe(listener: PipelineHandleListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshotState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close(): void {
    this.isClosed = true;
    this.lastDetailRefreshKey = null;
    this.lastSnapshotRefreshKey = null;
    this.detailRefreshInFlight = false;
    this.streamSubscription?.close();
    this.streamSubscription = null;
    if (this.activeLiveSession && !this.activeLiveSession.closed) {
      this.activeLiveSession.close(1000, "pipeline handle closed");
    }
    this.activeLiveSession = null;
    if (!this.isConsumed && this.snapshotState.leaseStatus === "prepared") {
      this.updateRuntime(markPreparedHandleRuntimeAborted(this.snapshotState.runtime));
      return;
    }
    this.setSnapshot({ streamSubscription: null });
  }

  private async startBatchUpload(
    file: Blob,
    uploadOptions?: UploadToSignedUrlOptions,
  ): Promise<Extract<PipelineStartUploadResult, { mode: "batch" }>> {
    this.markConsumed("uploading");
    const upload = await this.sdk.uploadToSignedUrl(
      this.snapshotState.bootstrap.upload,
      file,
      uploadOptions,
    );
    const job = await this.sdk.finalizeUpload(
      this.snapshotState.jobId,
      {
        audio_uri: this.snapshotState.bootstrap.upload.audio_uri,
        ...upload.telemetry,
      },
      {
        pipelineAlias: this.context.createOptions.pipelineAlias,
        headers: this.context.createOptions.headers,
      },
    );
    this.setSnapshot({
      detail: this.snapshotState.detail
        ? rehydratePreparedHandleDetail(
            this.snapshotState.detail,
            this.snapshotState.runtime,
          )
        : null,
    });
    return {
      bootstrap: this.snapshotState.bootstrap,
      mode: "batch",
      job,
    };
  }

  private async startLiveUpload(
    file: Blob,
    liveOptions?: StreamLiveFileOptions,
  ): Promise<Extract<PipelineStartUploadResult, { mode: "live" }>> {
    return this.withLiveReprepare(async () => {
      const nextSession = await this.sdk.openLiveSession(this.snapshotState.bootstrap, {
        signal: liveOptions?.signal,
      });
      this.activeLiveSession = nextSession;
      this.updateRuntime(markPreparedHandleLiveUploadOpened(this.snapshotState.runtime, nextSession.sessionId), {
        streamSessionId: nextSession.sessionId,
      });
      await streamFileToLiveSession(nextSession, file, liveOptions, {
        onChunkSent: (chunkCount) => {
          this.sentChunkCount = chunkCount;
          if (!this.isConsumed) {
            this.markConsumed("uploading", { streamSessionId: nextSession.sessionId });
          }
        },
      });
      return {
        bootstrap: this.snapshotState.bootstrap,
        mode: "live",
        session: nextSession,
      };
    }, { allowPreConsumptionRetry: true });
  }

  private async withLiveReprepare<T>(
    operation: () => Promise<T>,
    options: { allowPreConsumptionRetry?: boolean } = {},
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const normalized = normalizeLiveTransportError(error, "live_stream_failed");
      if (
        options.allowPreConsumptionRetry &&
        this.snapshotState.leaseStatus === "prepared" &&
        !this.isConsumed &&
        this.sentChunkCount === 0 &&
        !this.hasReprepared &&
        isRetryablePreparedLiveError(normalized)
      ) {
        this.hasReprepared = true;
        await this.reprepare();
        return operation();
      }
      throw normalized;
    }
  }

  private async reprepare(): Promise<void> {
    this.streamSubscription?.close();
    this.streamSubscription = null;
    this.activeLiveSession?.close(1000, "pipeline handle reparing");
    this.activeLiveSession = null;
    this.isConsumed = false;
    this.sentChunkCount = 0;
    const bootstrap = await this.sdk.createJob(this.context.createRequest, {
      pipelineAlias: this.context.createOptions.pipelineAlias,
      headers: this.context.createOptions.headers,
    });
    if (this.kind === "capture" && !bootstrap.stream_ingest) {
      throw new VeritieSDKError({
        code: "live_unavailable",
        message: "Prepared capture lease no longer includes live ingest capability",
      });
    }
    this.snapshotState = buildPreparedHandleSnapshot(this.kind, this.context.transportPolicy, bootstrap);
    this.emit();
  }

  private applyStreamEvent(event: StreamEvent): void {
    if (event.event === "job.snapshot") {
      this.isConsumed = event.data.runtime.session_lease.status !== "prepared";
      this.setSnapshot({
        jobId: event.data.job_id,
        streamSessionId: event.data.stream_session_id ?? this.snapshotState.streamSessionId,
        leaseVersion: event.data.runtime.session_lease.lease_version,
        leaseStatus: event.data.runtime.session_lease.status,
        runtime: event.data.runtime,
        lastEvent: event,
        detail: this.snapshotState.detail
          ? rehydratePreparedHandleDetail(this.snapshotState.detail, event.data.runtime)
          : null,
      });
      if (shouldRefreshFromSnapshot(event.data)) {
        this.scheduleSnapshotRefresh(event.data);
      }
      return;
    }

    const runtime = reducePreparedHandleRuntimeFromEvent(
      this.snapshotState.runtime,
      event,
      this.kind,
    );
    this.isConsumed = runtime.session_lease.status !== "prepared";
    this.setSnapshot({
      runtime,
      leaseStatus: runtime.session_lease.status,
      lastEvent: event,
      detail: this.snapshotState.detail
        ? rehydratePreparedHandleDetail(this.snapshotState.detail, runtime)
        : null,
    });
    if (isJobDetailRefreshEvent(event.event)) {
      this.scheduleDetailRefresh(event);
    }
  }

  private scheduleDetailRefresh(event: Extract<StreamEvent, { event: Exclude<StreamEvent["event"], "job.snapshot"> }>): void {
    const refreshKey = jobDetailRefreshKey(event);
    if (this.lastDetailRefreshKey === refreshKey || this.detailRefreshInFlight) {
      return;
    }
    this.lastDetailRefreshKey = refreshKey;
    void this.refreshDetailFromServer();
  }

  private scheduleSnapshotRefresh(snapshot: JobSnapshotEvent): void {
    const refreshKey = jobSnapshotRefreshKey(snapshot);
    if (this.lastSnapshotRefreshKey === refreshKey || this.detailRefreshInFlight) {
      return;
    }
    this.lastSnapshotRefreshKey = refreshKey;
    void this.refreshDetailFromServer();
  }

  private async refreshDetailFromServer(): Promise<void> {
    if (this.isClosed || this.detailRefreshInFlight) {
      return;
    }
    this.detailRefreshInFlight = true;
    try {
      const detail = await this.sdk.getJob(this.snapshotState.jobId, {
        pipelineAlias: this.context.createOptions.pipelineAlias,
        headers: this.context.createOptions.headers,
      });
      if (!this.isClosed) {
        this.applyDetail(detail);
      }
    } catch {
      // Index and artifact hydration failures are product degradation, not transport errors.
    } finally {
      this.detailRefreshInFlight = false;
    }
  }

  private applyDetail(detail: JobDetailResponse): void {
    this.isConsumed = detail.runtime.session_lease.status !== "prepared";
    this.setSnapshot({
      jobId: detail.job_id,
      streamSessionId: detail.stream_session_id ?? this.snapshotState.streamSessionId,
      leaseVersion: detail.runtime.session_lease.lease_version,
      leaseStatus: detail.runtime.session_lease.status,
      runtime: detail.runtime,
      detail,
    });
  }

  private updateRuntime(
    runtime: RuntimeState,
    options: { streamSessionId?: string } = {},
  ): void {
    this.isConsumed = runtime.session_lease.status !== "prepared";
    this.setSnapshot({
      runtime,
      streamSessionId: options.streamSessionId ?? runtime.session_lease.stream_session_id ?? this.snapshotState.streamSessionId,
      leaseVersion: runtime.session_lease.lease_version,
      leaseStatus: runtime.session_lease.status,
      detail: this.snapshotState.detail
        ? rehydratePreparedHandleDetail(this.snapshotState.detail, runtime)
        : null,
    });
  }

  private setSnapshot(patch: Partial<PipelineHandleSnapshot>): void {
    this.snapshotState = {
      ...this.snapshotState,
      ...patch,
    };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.snapshotState);
    }
  }

  private assertActionAllowed(action: "startCapture" | "startUpload" | "stream"): void {
    if (this.isClosed) {
      throw new VeritieSDKError({
        code: "pipeline_handle_closed",
        message: `Pipeline handle is closed and cannot ${action}`,
      });
    }
    if (this.isConsumed) {
      throw new VeritieSDKError({
        code: "pipeline_handle_consumed",
        message: `Pipeline handle has already been consumed and cannot ${action} again`,
      });
    }
  }

  private markConsumed(
    overall: RuntimeState["overall"],
    options: { streamSessionId?: string } = {},
  ): void {
    this.isConsumed = true;
    this.updateRuntime(
      markPreparedHandleRuntimeConsumed(this.snapshotState.runtime, overall),
      options,
    );
  }

  private canFallbackToBatch(error: VeritieSDKError): boolean {
    return (
      !this.isConsumed &&
      this.sentChunkCount === 0 &&
      canFallbackToBatch(error)
    );
  }
}

export class VeritieSDK {
  private readonly http: HttpTransport;
  private readonly live: LiveTransport;
  private readonly sse: SSETransport;
  private readonly openStreams = new Set<JobStreamSubscription>();

  constructor(private readonly config: VeritieClientConfig) {
    this.http = new HttpTransport(config);
    this.live = new LiveTransport(config);
    this.sse = new SSETransport(config);
  }

  async createJob(request: CreateJobRequest, options: CreateJobOptions = {}): Promise<BootstrapJobResponse> {
    return this.http.request<BootstrapJobResponse>({
      method: "POST",
      path: "/v1/jobs",
      pipelineAlias: options.pipelineAlias,
      headers: {
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
        ...options.headers,
      },
      json: request,
    });
  }

  async uploadToSignedUrl(
    upload: UploadTarget,
    body: Blob,
    options: UploadToSignedUrlOptions = {},
  ): Promise<UploadToSignedUrlResult> {
    const contentType = options.contentType ?? body.type;
    if (upload.required_mime_type && contentType && upload.required_mime_type !== contentType) {
      throw new VeritieSDKError({
        code: "content_type_mismatch",
        message: `Upload content type ${contentType} does not match required type ${upload.required_mime_type}`,
      });
    }

    const headers = new Headers(options.headers);
    headers.set("x-upsert", "false");

    let uploadBody: BodyInit = body;
    if (typeof FormData !== "undefined" && body instanceof Blob) {
      const formData = new FormData();
      formData.append("cacheControl", "3600");
      formData.append("", body);
      uploadBody = formData;
      headers.delete("Content-Type");
    } else if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const uploadStartedAt = Date.now();
    try {
      await this.http.upload(upload.url, uploadBody, {
        headers,
        signal: options.signal,
      });
      return {
        telemetry: buildUploadTelemetry(upload, body, uploadStartedAt, Date.now()),
      };
    } catch (error) {
      if (error instanceof VeritieSDKError) {
        throw error;
      }

      let uploadOrigin: string | null = null;
      let uploadPathname: string | null = null;
      try {
        const parsed = new URL(upload.url);
        uploadOrigin = parsed.origin;
        uploadPathname = parsed.pathname;
      } catch {
        uploadPathname = upload.url;
      }

      throw new VeritieSDKError({
        code: "upload_request_failed",
        message: "Failed to upload bytes to the signed URL",
        details: {
          upload_origin: uploadOrigin,
          upload_pathname: uploadPathname,
          required_mime_type: upload.required_mime_type ?? null,
          content_type: contentType || null,
        },
        cause: error,
      });
    }
  }

  async finalizeUpload(
    jobId: string,
    request: FinalizeUploadRequest,
    options: FinalizeUploadOptions = {},
  ): Promise<JobResponse> {
    return this.http.request<JobResponse>({
      method: "POST",
      path: `/v1/jobs/${jobId}/upload-finalize`,
      pipelineAlias: options.pipelineAlias,
      headers: options.headers,
      json: request,
    });
  }

  async getJob(jobId: string, options: GetJobOptions = {}): Promise<JobDetailResponse> {
    const response = await this.http.request<RawJobDetailResponse>({
      method: "GET",
      path: `/v1/jobs/${jobId}`,
      pipelineAlias: options.pipelineAlias,
      headers: options.headers,
    });
    return normalizeJobDetailResponse(response);
  }

  async getPipelineConfig(
    options: GetPipelineConfigOptions = {},
  ): Promise<PipelineDisplayConfigV1> {
    return this.http.request<PipelineDisplayConfigV1>({
      method: "GET",
      path: "/v1/pipeline/config",
      pipelineAlias: options.pipelineAlias,
      headers: options.headers,
    });
  }

  async rerunJob(jobId: string, options: RerunJobOptions = {}): Promise<JobResponse> {
    return this.http.request<JobResponse>({
      method: "POST",
      path: `/v1/jobs/${jobId}/rerun`,
      pipelineAlias: options.pipelineAlias,
      headers: options.headers,
      json: {},
    });
  }

  async streamJob(jobId: string, options: StreamJobOptions = {}): Promise<JobStreamSubscription> {
    const subscription = await this.sse.open(`/v1/jobs/${jobId}/stream`, options);
    this.openStreams.add(subscription);
    void (async () => {
      try {
        await subscription.completed;
      } catch {
        // Stream consumers own failures; this cleanup path should never leak unhandled rejections.
      } finally {
        this.openStreams.delete(subscription);
      }
    })();
    return subscription;
  }

  async openLiveSession(bootstrap: BootstrapJobResponse, options: OpenLiveSessionOptions = {}): Promise<LiveJobSession> {
    if (!bootstrap.stream_ingest) {
      throw new VeritieSDKError({
        code: "live_unavailable",
        message: "Job bootstrap did not include live ingest capability",
      });
    }
    return this.live.open(bootstrap.job_id, bootstrap.stream_ingest, options);
  }

  async streamLiveFile(
    bootstrap: BootstrapJobResponse,
    file: Blob,
    options: StreamLiveFileOptions = {},
  ): Promise<LiveJobSession> {
    const session = await this.openLiveSession(bootstrap, { signal: options.signal });
    await streamFileToLiveSession(session, file, options);
    return session;
  }

  async prepareCapture(
    request: CreateJobRequest,
    options: PrepareCaptureOptions = {},
  ): Promise<PipelineHandle> {
    const transportPolicy = options.transportPolicy ?? "live_only";
    const bootstrap = await this.createJob(request, options);
    if (!bootstrap.stream_ingest) {
      throw new VeritieSDKError({
        code: "live_unavailable",
        message: "Prepared capture lease did not include live ingest capability",
      });
    }

    return new PipelineHandleImpl(this, "capture", {
      createRequest: request,
      createOptions: options,
      transportPolicy: transportPolicy === "auto" ? "live_only" : transportPolicy,
    }, bootstrap);
  }

  async prepareUpload(
    request: CreateJobRequest,
    options: PrepareUploadOptions = {},
  ): Promise<PipelineHandle> {
    const bootstrap = await this.createJob(request, options);
    return new PipelineHandleImpl(this, "upload", {
      createRequest: request,
      createOptions: options,
      transportPolicy: options.transportPolicy ?? "batch_only",
    }, bootstrap);
  }

  async createAndUploadJob(options: CreateAndUploadJobOptions): Promise<CreateAndUploadJobResult> {
    const bootstrap = await this.createJob(options.create, {
      pipelineAlias: options.pipelineAlias,
      idempotencyKey: options.idempotencyKey,
    });

    const upload = await this.uploadToSignedUrl(bootstrap.upload, options.file, options.upload);
    const job = await this.finalizeUpload(
      bootstrap.job_id,
      {
        audio_uri: bootstrap.upload.audio_uri,
        ...upload.telemetry,
      },
      { pipelineAlias: options.pipelineAlias },
    );

    return { bootstrap, job };
  }

  async createAndStreamJob(options: CreateAndStreamJobOptions): Promise<CreateAndStreamJobResult> {
    const bootstrap = await this.createJob(options.create, {
      pipelineAlias: options.pipelineAlias,
      idempotencyKey: options.idempotencyKey,
    });

    if (!bootstrap.stream_ingest) {
      const upload = await this.uploadToSignedUrl(bootstrap.upload, options.file, options.upload);
      const job = await this.finalizeUpload(
        bootstrap.job_id,
        {
          audio_uri: bootstrap.upload.audio_uri,
          ...upload.telemetry,
        },
        { pipelineAlias: options.pipelineAlias },
      );
      return { bootstrap, mode: "batch", job, fallback_reason: "bootstrap_unavailable" };
    }

    try {
      const session = await this.streamLiveFile(bootstrap, options.file, options.live);
      return { bootstrap, mode: "live", session };
    } catch (error) {
      const normalized = normalizeLiveTransportError(error, "live_stream_failed");
      if (normalized.code === "live_open_failed" || normalized.code === "live_unavailable" || normalized.code === "live_websocket_unavailable") {
        const upload = await this.uploadToSignedUrl(bootstrap.upload, options.file, options.upload);
        const job = await this.finalizeUpload(
          bootstrap.job_id,
          {
            audio_uri: bootstrap.upload.audio_uri,
            ...upload.telemetry,
          },
          { pipelineAlias: options.pipelineAlias },
        );
        return {
          bootstrap,
          mode: "batch",
          job,
          fallback_reason: "live_open_failed",
          live_error_code: normalized.code,
        };
      }
      throw normalized;
    }
  }

  close(): void {
    this.destroy();
  }

  destroy(): void {
    for (const stream of this.openStreams) {
      stream.close();
    }
    this.openStreams.clear();
  }

  getConfig(): VeritieClientConfig {
    return this.config;
  }
}

interface RawJobDetailEvent {
  ID?: string;
  JobID?: string;
  Type?: JobEvent["type"];
  Level?: JobEvent["level"];
  Message?: string;
  Progress?: number;
  Data?: string;
  CreatedAt?: string;
}

interface RawJobDetailResponse extends Omit<Partial<JobDetailResponse>, "events" | "index"> {
  events: Array<JobEvent | RawJobDetailEvent>;
  index?: unknown;
}

function normalizeJobDetailResponse(response: RawJobDetailResponse): JobDetailResponse {
  let index: ReturnType<typeof normalizeEvidenceIndex>;
  try {
    index = normalizeEvidenceIndex(response.index);
  } catch (error) {
    logRawEvidenceIndexDebug("normalize-failed", response.index);
    throw error;
  }
  if (response.index !== undefined && response.index !== null && !index) {
    logRawEvidenceIndexDebug("normalize-missing", response.index, index);
  }
  const normalized = normalizeRuntimeCompatibilityState({ ...response, index });
  return {
    job_id: response.job_id ?? "",
    status: response.status ?? "queued",
    rerun_of_job_id: response.rerun_of_job_id,
    accepted_request: response.accepted_request ?? { audio_content_type: "" },
    step_traces: response.step_traces,
    transcript: response.transcript,
    extraction: response.extraction,
    ...(index ? { index } : {}),
    tool_suggestions: response.tool_suggestions,
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
    error_message: response.error_message,
    events: response.events.map(normalizeJobEvent),
  };
}

function normalizeJobEvent(event: JobEvent | RawJobDetailEvent): JobEvent {
  if ("type" in event) {
    return event;
  }

  return {
    id: event.ID,
    type: event.Type ?? "progress",
    level: event.Level ?? "info",
    message: event.Message ?? "",
    progress: event.Progress ?? 0,
    data: decodeEventData(event.Data),
    created_at: event.CreatedAt,
  };
}

function decodeEventData(raw?: string): Record<string, unknown> | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const decoded = decodeBase64UTF8(raw);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function decodeBase64UTF8(raw: string): string {
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(raw);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const maybeBuffer = (globalThis as { Buffer?: { from(input: string, encoding: string): { toString(encoding: string): string } } })
    .Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(raw, "base64").toString("utf8");
  }

  throw new VeritieSDKError({
    code: "base64_decode_unavailable",
    message: "No base64 decoder is available in this runtime",
  });
}

async function streamFileToLiveSession(
  session: LiveJobSession,
  file: Blob,
  options: StreamLiveFileOptions = {},
  hooks: StreamLiveFileHooks = {},
): Promise<{ sentChunkCount: number }> {
  const chunkSize = options.chunkSizeBytes && options.chunkSizeBytes > 0
    ? options.chunkSizeBytes
    : DEFAULT_LIVE_CHUNK_SIZE_BYTES;
  const fullBuffer = new Uint8Array(await file.arrayBuffer());
  const finalChecksum = await digestSHA256Hex(fullBuffer);

  let offset = 0;
  let sequence = 0;
  let sentChunkCount = 0;
  while (offset < fullBuffer.byteLength) {
    const next = fullBuffer.subarray(offset, Math.min(offset + chunkSize, fullBuffer.byteLength));
    const checksum = await digestSHA256Hex(next);
    await session.sendChunk({
      sequence,
      offset_bytes: offset,
      size_bytes: next.byteLength,
      chunk_sha256: checksum,
    }, next);
    sentChunkCount += 1;
    hooks.onChunkSent?.(sentChunkCount);
    offset += next.byteLength;
    sequence += 1;
  }

  await session.end({
    last_sequence: sequence - 1,
    total_bytes: fullBuffer.byteLength,
    final_checksum_sha256: finalChecksum,
  });
  return { sentChunkCount };
}

function canFallbackToBatch(error: VeritieSDKError): boolean {
  return error.code === "live_open_failed"
    || error.code === "live_unavailable"
    || error.code === "live_websocket_unavailable"
    || error.code === "live_session_closed";
}

function isRetryablePreparedLiveError(error: VeritieSDKError): boolean {
  if (error.code === "live_session_closed") {
    return true;
  }
  if (error.code !== "live_open_failed") {
    return false;
  }
  const message = `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`.toLowerCase();
  return message.includes("stale") || message.includes("expired") || message.includes("invalid live token");
}

function buildUploadTelemetry(
  upload: UploadTarget,
  body: Blob,
  uploadStartedAt: number,
  uploadAcknowledgedAt: number,
): UploadTelemetry {
  return {
    ...(upload.issued_at ? { upload_instruction_issued_at: upload.issued_at } : {}),
    upload_ack_received_at: new Date(uploadAcknowledgedAt).toISOString(),
    client_upload_duration_ms: Math.max(0, uploadAcknowledgedAt - uploadStartedAt),
    file_size_bytes: body.size,
  };
}
