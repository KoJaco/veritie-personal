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
        const jobId = captureHandle?.snapshot.jobId;
        captureFlowLog.info("lease.release", { jobId });
        prepareGenerationRef.current += 1;
        captureHandle?.close();
        veritie.clearPreparedHandle();
        setCaptureHandle(null);
        setLeasePhase("idle");
        setLeaseError(null);
    }, [captureHandle, veritie]);

    const prepareLease = useCallback(
        async (metadata: CaptureJobMetadata): Promise<PipelineHandle> => {
            const generation = prepareGenerationRef.current + 1;
            prepareGenerationRef.current = generation;
            setLeasePhase("preparing");
            setLeaseError(null);

            captureHandle?.close();
            veritie.clearPreparedHandle();
            setCaptureHandle(null);

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
        },
        [captureHandle, veritie],
    );

    const renewLease = useCallback(() => {
        captureFlowLog.info("lease.renew", {
            jobId: captureHandle?.snapshot.jobId,
        });
        captureHandle?.close();
        veritie.clearPreparedHandle();
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
