"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useVeritie, type useVeritie as UseVeritieHook } from "@veritie/sdk";
import type { CaptureJobMetadata, PipelineDisplayConfigV1, PipelineHandle } from "@veritie/sdk";
import { browserFetch } from "@/lib/veritie/browser-fetch";
import { captureFlowLog } from "@/lib/capture/capture-flow-logger";
import {
    buildPipelineCacheKey,
    getCachedClientPipelineConfig,
    getClientPipelineExtractionConfig,
} from "@/lib/capture/client-pipeline-config";
import {
    resolvePipelineExtractionConfig,
    type PipelineExtractionConfig,
} from "@/lib/capture/pipeline-config";

export type CaptureLeasePhase = "idle" | "preparing" | "ready" | "error";

type VeritieCaptureLeaseContextValue = {
    veritie: ReturnType<typeof UseVeritieHook>;
    captureHandle: PipelineHandle | null;
    leasePhase: CaptureLeasePhase;
    leaseError: string | null;
    pipelineConfig: PipelineDisplayConfigV1 | null;
    extractionConfig: PipelineExtractionConfig;
    prepareLease: (metadata: CaptureJobMetadata) => Promise<PipelineHandle>;
    getOrPrepareLease: (metadata: CaptureJobMetadata) => Promise<PipelineHandle>;
    renewLease: () => void;
    releaseLease: () => void;
};

const VeritieCaptureLeaseContext =
    createContext<VeritieCaptureLeaseContextValue | null>(null);

export function VeritieCaptureLeaseProvider({ children }: { children: ReactNode }) {
    const veritieConfig = useMemo(
        () => ({
            baseUrl: "/api/veritie",
            pipelineAlias: "proxy",
            fetch: browserFetch,
        }),
        [],
    );

    const pipelineCacheKey = useMemo(
        () =>
            buildPipelineCacheKey(
                veritieConfig.baseUrl,
                veritieConfig.pipelineAlias,
            ),
        [veritieConfig.baseUrl, veritieConfig.pipelineAlias],
    );

    const veritie = useVeritie({ config: veritieConfig });
    const [captureHandle, setCaptureHandle] = useState<PipelineHandle | null>(null);
    const [leasePhase, setLeasePhase] = useState<CaptureLeasePhase>("idle");
    const [leaseError, setLeaseError] = useState<string | null>(null);
    const [pipelineConfig, setPipelineConfig] = useState<
        PipelineDisplayConfigV1 | null
    >(() => getCachedClientPipelineConfig(pipelineCacheKey));
    const prepareGenerationRef = useRef(0);
    const captureHandleRef = useRef<PipelineHandle | null>(null);
    const pendingPrepareRef = useRef<{
        generation: number;
        promise: Promise<PipelineHandle>;
    } | null>(null);
    const pipelineConfigFetchStartedRef = useRef(false);

    const extractionConfig = useMemo(
        () => resolvePipelineExtractionConfig(pipelineConfig),
        [pipelineConfig],
    );

    const getPipelineConfig = veritie.getPipelineConfig;

    useEffect(() => {
        if (pipelineConfigFetchStartedRef.current) {
            return;
        }
        pipelineConfigFetchStartedRef.current = true;

        let cancelled = false;

        void getClientPipelineExtractionConfig(getPipelineConfig, pipelineCacheKey)
            .then(() => {
                if (!cancelled) {
                    setPipelineConfig(getCachedClientPipelineConfig(pipelineCacheKey));
                }
            })
            .catch((error) => {
                captureFlowLog.warn("pipeline.config.fallback", {
                    error: error instanceof Error ? error.message : String(error),
                });
                if (!cancelled) {
                    setPipelineConfig(getCachedClientPipelineConfig(pipelineCacheKey));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [getPipelineConfig, pipelineCacheKey]);

    const releaseLease = useCallback(() => {
        const handle = captureHandleRef.current ?? captureHandle;
        const jobId = handle?.snapshot.jobId;
        captureFlowLog.info("lease.release", { jobId });
        prepareGenerationRef.current += 1;
        pendingPrepareRef.current = null;
        captureHandleRef.current = null;
        handle?.close();
        veritie.clearPreparedHandle();
        setCaptureHandle(null);
        setLeasePhase("idle");
        setLeaseError(null);
    }, [captureHandle, veritie]);

    const prepareLease = useCallback(
        (metadata: CaptureJobMetadata): Promise<PipelineHandle> => {
            const generation = prepareGenerationRef.current + 1;
            prepareGenerationRef.current = generation;
            setLeasePhase("preparing");
            setLeaseError(null);

            const previousHandle = captureHandleRef.current ?? captureHandle;
            previousHandle?.close();
            veritie.clearPreparedHandle();
            captureHandleRef.current = null;
            setCaptureHandle(null);

            const promise = (async () => {
                try {
                    captureFlowLog.info("lease.prepare.start", {
                        captured_at: metadata.captured_at,
                        timezone: metadata.timezone,
                        locale: metadata.locale,
                        has_location_label: Boolean(metadata.location_label),
                    });
                    const handle = await veritie.prepareCapture(
                        {
                            audio_content_type: "audio/webm",
                            metadata,
                        },
                        { transportPolicy: "live_only" },
                    );

                    if (prepareGenerationRef.current !== generation) {
                        handle.close();
                        throw new Error("Capture lease preparation was superseded");
                    }

                    setCaptureHandle(handle);
                    captureHandleRef.current = handle;
                    setLeasePhase("ready");
                    captureFlowLog.info("lease.prepare.ready", {
                        jobId: handle.snapshot.jobId,
                        sessionId: handle.snapshot.bootstrap.stream_ingest?.session_id,
                    });
                    return handle;
                } catch (error) {
                    if (prepareGenerationRef.current !== generation) {
                        throw new Error("Capture lease preparation was superseded");
                    }

                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to prepare Veritie capture lease";
                    setLeaseError(message);
                    setLeasePhase("error");
                    captureFlowLog.error("lease.prepare.failed", { error: message });
                    throw error instanceof Error ? error : new Error(message);
                }
            })();

            pendingPrepareRef.current = { generation, promise };
            void promise.then(
                () => {
                    if (pendingPrepareRef.current?.generation === generation) {
                        pendingPrepareRef.current = null;
                    }
                },
                () => {
                    if (pendingPrepareRef.current?.generation === generation) {
                        pendingPrepareRef.current = null;
                    }
                },
            );

            return promise;
        },
        [captureHandle, veritie],
    );

    const getOrPrepareLease = useCallback(
        (metadata: CaptureJobMetadata): Promise<PipelineHandle> => {
            if (captureHandleRef.current) {
                return Promise.resolve(captureHandleRef.current);
            }

            const pendingPrepare = pendingPrepareRef.current;
            if (pendingPrepare) {
                return pendingPrepare.promise;
            }

            return prepareLease(metadata);
        },
        [prepareLease],
    );

    const renewLease = useCallback(() => {
        const handle = captureHandleRef.current ?? captureHandle;
        captureFlowLog.info("lease.renew", {
            jobId: handle?.snapshot.jobId,
        });
        handle?.close();
        veritie.clearPreparedHandle();
        prepareGenerationRef.current += 1;
        pendingPrepareRef.current = null;
        captureHandleRef.current = null;
        setCaptureHandle(null);
        setLeasePhase("idle");
        setLeaseError(null);
    }, [captureHandle, veritie]);

    const value = useMemo(
        () => ({
            veritie,
            captureHandle,
            leasePhase,
            leaseError,
            pipelineConfig,
            extractionConfig,
            prepareLease,
            getOrPrepareLease,
            renewLease,
            releaseLease,
        }),
        [
            veritie,
            captureHandle,
            leasePhase,
            leaseError,
            pipelineConfig,
            extractionConfig,
            prepareLease,
            getOrPrepareLease,
            renewLease,
            releaseLease,
        ],
    );

    return (
        <VeritieCaptureLeaseContext.Provider value={value}>
            {children}
        </VeritieCaptureLeaseContext.Provider>
    );
}

export function useVeritieCaptureLease(): VeritieCaptureLeaseContextValue {
    const context = useContext(VeritieCaptureLeaseContext);
    if (!context) {
        throw new Error(
            "useVeritieCaptureLease must be used within VeritieCaptureLeaseProvider",
        );
    }
    return context;
}
