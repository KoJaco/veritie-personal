"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useVeritie, type useVeritie as UseVeritieHook } from "@veritie/sdk";
import type { PipelineHandle } from "@veritie/sdk";
import { browserFetch } from "@/lib/veritie/browser-fetch";
import { captureFlowLog } from "@/lib/capture/capture-flow-logger";

export type CaptureLeasePhase = "idle" | "preparing" | "ready" | "error";

type VeritieCaptureLeaseContextValue = {
    veritie: ReturnType<typeof UseVeritieHook>;
    captureHandle: PipelineHandle | null;
    leasePhase: CaptureLeasePhase;
    leaseError: string | null;
    prepareLease: () => Promise<void>;
    renewLease: () => Promise<void>;
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

    const veritie = useVeritie({ config: veritieConfig });
    const [captureHandle, setCaptureHandle] = useState<PipelineHandle | null>(null);
    const [leasePhase, setLeasePhase] = useState<CaptureLeasePhase>("idle");
    const [leaseError, setLeaseError] = useState<string | null>(null);
    const prepareGenerationRef = useRef(0);

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

    const prepareLease = useCallback(async () => {
        const generation = prepareGenerationRef.current + 1;
        prepareGenerationRef.current = generation;
        setLeasePhase("preparing");
        setLeaseError(null);

        captureHandle?.close();
        veritie.clearPreparedHandle();
        setCaptureHandle(null);

        try {
            captureFlowLog.info("lease.prepare.start");
            const handle = await veritie.prepareCapture(
                { audio_content_type: "audio/webm" },
                { transportPolicy: "live_only" },
            );

            if (prepareGenerationRef.current !== generation) {
                handle.close();
                return;
            }

            setCaptureHandle(handle);
            setLeasePhase("ready");
            captureFlowLog.info("lease.prepare.ready", {
                jobId: handle.snapshot.jobId,
                sessionId: handle.snapshot.bootstrap.stream_ingest?.session_id,
            });
        } catch (error) {
            if (prepareGenerationRef.current !== generation) {
                return;
            }

            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to prepare Veritie capture lease";
            setLeaseError(message);
            setLeasePhase("error");
            captureFlowLog.error("lease.prepare.failed", { error: message });
        }
    }, [captureHandle, veritie]);

    const renewLease = useCallback(async () => {
        captureFlowLog.info("lease.renew", {
            jobId: captureHandle?.snapshot.jobId,
        });
        captureHandle?.close();
        veritie.clearPreparedHandle();
        setCaptureHandle(null);
        setLeasePhase("idle");
        await prepareLease();
    }, [captureHandle, prepareLease, veritie]);

    const value = useMemo(
        () => ({
            veritie,
            captureHandle,
            leasePhase,
            leaseError,
            prepareLease,
            renewLease,
            releaseLease,
        }),
        [
            veritie,
            captureHandle,
            leasePhase,
            leaseError,
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
