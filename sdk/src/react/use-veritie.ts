import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeThrownError } from "../errors";
import { VeritieSDK } from "../client/veritie-sdk";
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
  JobResponse,
  JobSnapshotEvent,
  OpenLiveSessionOptions,
  JobStreamSubscription,
  PipelineDisplayConfigV1,
  PipelineHandle,
  PipelineHandleSnapshot,
  PrepareCaptureOptions,
  PrepareUploadOptions,
  RerunJobOptions,
  StreamEvent,
  StreamLiveFileOptions,
  StreamJobOptions,
  UploadTarget,
  UploadToSignedUrlOptions,
  UploadToSignedUrlResult,
  VeritieClientConfig,
} from "../types";

export type HookConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface UseVeritieOptions {
  config: VeritieClientConfig;
}

interface UseVeritieResult {
  connectionStatus: HookConnectionStatus;
  error: Error | null;
  events: StreamEvent[];
  latestSnapshot: JobSnapshotEvent | null;
  preparedHandle: PipelineHandle | null;
  preparedHandleSnapshot: PipelineHandleSnapshot | null;
  createJob(request: CreateJobRequest, options?: CreateJobOptions): Promise<BootstrapJobResponse>;
  uploadToSignedUrl(
    upload: UploadTarget,
    body: Blob,
    options?: UploadToSignedUrlOptions,
  ): Promise<UploadToSignedUrlResult>;
  finalizeUpload(
    jobId: string,
    request: FinalizeUploadRequest,
    options?: FinalizeUploadOptions,
  ): Promise<JobResponse>;
  getJob(jobId: string, options?: GetJobOptions): Promise<JobDetailResponse>;
  getPipelineConfig(options?: GetPipelineConfigOptions): Promise<PipelineDisplayConfigV1>;
  rerunJob(jobId: string, options?: RerunJobOptions): Promise<JobResponse>;
  subscribeToJob(jobId: string, options?: StreamJobOptions): Promise<JobStreamSubscription>;
  createAndUploadJob(options: CreateAndUploadJobOptions): Promise<CreateAndUploadJobResult>;
  openLiveSession(
    bootstrap: BootstrapJobResponse,
    options?: OpenLiveSessionOptions,
  ): Promise<LiveJobSession>;
  streamLiveFile(
    bootstrap: BootstrapJobResponse,
    file: Blob,
    options?: StreamLiveFileOptions,
  ): Promise<LiveJobSession>;
  createAndStreamJob(options: CreateAndStreamJobOptions): Promise<CreateAndStreamJobResult>;
  prepareCapture(
    request: CreateJobRequest,
    options?: PrepareCaptureOptions,
  ): Promise<PipelineHandle>;
  prepareUpload(
    request: CreateJobRequest,
    options?: PrepareUploadOptions,
  ): Promise<PipelineHandle>;
  clearPreparedHandle(): void;
  reset(): void;
  destroy(): void;
}

export function useVeritie({ config }: UseVeritieOptions): UseVeritieResult {
  const sdkRef = useRef<VeritieSDK | null>(null);
  const subscriptionRef = useRef<JobStreamSubscription | null>(null);
  const configSnapshotRef = useRef<ComparableConfigSnapshot | null>(null);
  const preparedHandleRef = useRef<PipelineHandle | null>(null);
  const preparedHandleUnsubscribeRef = useRef<(() => void) | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<HookConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<JobSnapshotEvent | null>(null);
  const [preparedHandle, setPreparedHandle] = useState<PipelineHandle | null>(null);
  const [preparedHandleSnapshot, setPreparedHandleSnapshot] = useState<PipelineHandleSnapshot | null>(null);

  const releasePreparedHandle = useCallback((): void => {
    preparedHandleUnsubscribeRef.current?.();
    preparedHandleUnsubscribeRef.current = null;
    preparedHandleRef.current?.close();
    preparedHandleRef.current = null;
  }, []);

  const clearPreparedHandleState = useCallback((): void => {
    setPreparedHandle(null);
    setPreparedHandleSnapshot(null);
    releasePreparedHandle();
  }, [releasePreparedHandle]);

  const bindPreparedHandle = useCallback((handle: PipelineHandle | null): void => {
    if (preparedHandleRef.current && preparedHandleRef.current !== handle) {
      clearPreparedHandleState();
    } else {
      preparedHandleUnsubscribeRef.current?.();
      preparedHandleUnsubscribeRef.current = null;
    }

    preparedHandleRef.current = handle;
    setPreparedHandle(handle);
    if (!handle) {
      setPreparedHandleSnapshot(null);
      return;
    }

    preparedHandleUnsubscribeRef.current = handle.subscribe((snapshot) => {
      setPreparedHandleSnapshot(snapshot);
    });
  }, [clearPreparedHandleState]);

  useEffect(() => {
    const nextSnapshot = toComparableConfigSnapshot(config);
    const currentSnapshot = configSnapshotRef.current;
    const shouldRecreate = sdkRef.current === null || !equalConfigSnapshots(currentSnapshot, nextSnapshot);

    if (shouldRecreate) {
      subscriptionRef.current?.close();
      subscriptionRef.current = null;
      clearPreparedHandleState();
      sdkRef.current?.destroy();
      sdkRef.current = new VeritieSDK(config);
      configSnapshotRef.current = nextSnapshot;
    }
  }, [clearPreparedHandleState, config]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.close();
      subscriptionRef.current = null;
      clearPreparedHandleState();
      sdkRef.current?.destroy();
      sdkRef.current = null;
      configSnapshotRef.current = null;
    };
  }, [clearPreparedHandleState]);

  const createJob = useCallback(async (request: CreateJobRequest, options?: CreateJobOptions) => {
    return ensureSDK(sdkRef.current).createJob(request, options);
  }, []);

  const uploadToSignedUrl = useCallback(async (
    upload: UploadTarget,
    body: Blob,
    options?: UploadToSignedUrlOptions,
  ): Promise<UploadToSignedUrlResult> => {
    return ensureSDK(sdkRef.current).uploadToSignedUrl(upload, body, options);
  }, []);

  const finalizeUpload = useCallback(async (
    jobId: string,
    request: FinalizeUploadRequest,
    options?: FinalizeUploadOptions,
  ): Promise<JobResponse> => {
    return ensureSDK(sdkRef.current).finalizeUpload(jobId, request, options);
  }, []);

  const getJob = useCallback(async (jobId: string, options?: GetJobOptions): Promise<JobDetailResponse> => {
    return ensureSDK(sdkRef.current).getJob(jobId, options);
  }, []);

  const getPipelineConfig = useCallback(async (
    options?: GetPipelineConfigOptions,
  ): Promise<PipelineDisplayConfigV1> => {
    return ensureSDK(sdkRef.current).getPipelineConfig(options);
  }, []);

  const rerunJob = useCallback(async (jobId: string, options?: RerunJobOptions): Promise<JobResponse> => {
    return ensureSDK(sdkRef.current).rerunJob(jobId, options);
  }, []);

  const createAndUploadJob = useCallback(async (options: CreateAndUploadJobOptions): Promise<CreateAndUploadJobResult> => {
    return ensureSDK(sdkRef.current).createAndUploadJob(options);
  }, []);

  const openLiveSession = useCallback(async (
    bootstrap: BootstrapJobResponse,
    options?: OpenLiveSessionOptions,
  ): Promise<LiveJobSession> => {
    return ensureSDK(sdkRef.current).openLiveSession(bootstrap, options);
  }, []);

  const streamLiveFile = useCallback(async (
    bootstrap: BootstrapJobResponse,
    file: Blob,
    options?: StreamLiveFileOptions,
  ): Promise<LiveJobSession> => {
    return ensureSDK(sdkRef.current).streamLiveFile(bootstrap, file, options);
  }, []);

  const createAndStreamJob = useCallback(async (options: CreateAndStreamJobOptions): Promise<CreateAndStreamJobResult> => {
    return ensureSDK(sdkRef.current).createAndStreamJob(options);
  }, []);

  const prepareCapture = useCallback(async (
    request: CreateJobRequest,
    options?: PrepareCaptureOptions,
  ): Promise<PipelineHandle> => {
    const handle = await ensureSDK(sdkRef.current).prepareCapture(request, options);
    bindPreparedHandle(handle);
    return handle;
  }, [bindPreparedHandle]);

  const prepareUpload = useCallback(async (
    request: CreateJobRequest,
    options?: PrepareUploadOptions,
  ): Promise<PipelineHandle> => {
    const handle = await ensureSDK(sdkRef.current).prepareUpload(request, options);
    bindPreparedHandle(handle);
    return handle;
  }, [bindPreparedHandle]);

  const subscribeToJob = useCallback(async (
    jobId: string,
    options: StreamJobOptions = {},
  ): Promise<JobStreamSubscription> => {
    subscriptionRef.current?.close();
    setConnectionStatus("connecting");
    setError(null);

    const subscription = await ensureSDK(sdkRef.current).streamJob(jobId, {
      ...options,
      onOpen: () => {
        setConnectionStatus("connected");
        options.onOpen?.();
      },
      onEvent: (event) => {
        setEvents((current) => [...current, event]);
        if (event.event === "job.snapshot") {
          setLatestSnapshot(event.data);
        }
        options.onEvent?.(event);
      },
      onError: (streamError) => {
        const normalized = normalizeThrownError(streamError);
        setError(normalized);
        setConnectionStatus("error");
        options.onError?.(normalized);
      },
    });

    subscriptionRef.current = subscription;
    void (async () => {
      try {
        await subscription.completed;
      } catch {
        // The caller owns stream failures; suppress hook-level unhandled rejections.
      } finally {
        if (subscriptionRef.current === subscription) {
          subscriptionRef.current = null;
        }
        setConnectionStatus((current) => (current === "error" ? current : "disconnected"));
      }
    })();

    return subscription;
  }, []);

  const reset = useCallback((): void => {
    subscriptionRef.current?.close();
    subscriptionRef.current = null;
    setConnectionStatus("disconnected");
    setError(null);
    setEvents([]);
    setLatestSnapshot(null);
  }, []);

  const clearPreparedHandle = useCallback((): void => {
    clearPreparedHandleState();
  }, [clearPreparedHandleState]);

  const destroy = useCallback((): void => {
    clearPreparedHandle();
    reset();
    sdkRef.current?.destroy();
  }, [clearPreparedHandle, reset]);

  return {
    connectionStatus,
    error,
    events,
    latestSnapshot,
    preparedHandle,
    preparedHandleSnapshot,
    createJob,
    uploadToSignedUrl,
    finalizeUpload,
    getJob,
    getPipelineConfig,
    rerunJob,
    subscribeToJob,
    createAndUploadJob,
    openLiveSession,
    streamLiveFile,
    createAndStreamJob,
    prepareCapture,
    prepareUpload,
    clearPreparedHandle,
    reset,
    destroy,
  };
}

function ensureSDK(sdk?: VeritieSDK | null): VeritieSDK {
  if (!sdk) {
    throw new Error("VeritieSDK is not initialized");
  }
  return sdk;
}

interface ComparableConfigSnapshot {
  baseUrl: string;
  pipelineAlias: string;
  apiKey?: string;
  apiKeyHeader?: VeritieClientConfig["apiKeyHeader"];
  headers: Array<[string, string]>;
  fetchRef?: VeritieClientConfig["fetch"];
  authRef?: VeritieClientConfig["getAuthHeaders"];
  webSocketRef?: VeritieClientConfig["webSocketFactory"];
}

function toComparableConfigSnapshot(config: VeritieClientConfig): ComparableConfigSnapshot {
  return {
    baseUrl: config.baseUrl,
    pipelineAlias: config.pipelineAlias,
    apiKey: config.apiKey,
    apiKeyHeader: config.apiKeyHeader,
    headers: normalizeHeaders(config.headers),
    fetchRef: config.fetch,
    authRef: config.getAuthHeaders,
    webSocketRef: config.webSocketFactory,
  };
}

function equalConfigSnapshots(
  left: ComparableConfigSnapshot | null,
  right: ComparableConfigSnapshot,
): boolean {
  if (left == null) {
    return false;
  }

  if (
    left.baseUrl !== right.baseUrl ||
    left.pipelineAlias !== right.pipelineAlias ||
    left.apiKey !== right.apiKey ||
    left.apiKeyHeader !== right.apiKeyHeader ||
    left.fetchRef !== right.fetchRef ||
    left.authRef !== right.authRef ||
    left.webSocketRef !== right.webSocketRef
  ) {
    return false;
  }

  if (left.headers.length !== right.headers.length) {
    return false;
  }

  return left.headers.every(([leftKey, leftValue], index) => {
    const [rightKey, rightValue] = right.headers[index] ?? [];
    return leftKey === rightKey && leftValue === rightValue;
  });
}

function normalizeHeaders(headers?: HeadersInit): Array<[string, string]> {
  if (!headers) {
    return [];
  }

  return Array.from(new Headers(headers).entries()).sort(([left], [right]) => left.localeCompare(right));
}
