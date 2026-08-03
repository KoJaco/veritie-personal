"use client";

import dynamic from "next/dynamic";
import { useVeritieCaptureLease } from "@/components/capture/VeritieCaptureLeaseContext";

const VoiceCapturePanel = dynamic(
    () =>
        import("@/components/capture/VoiceCapturePanel").then(
            (mod) => mod.VoiceCapturePanel,
        ),
    { ssr: false },
);

export function VoiceCaptureLauncherPanel({
    onBack,
    onComplete,
}: {
    onBack: () => void;
    onComplete: () => void;
}) {
    const { veritie, captureHandle, leasePhase, leaseError, renewLease } =
        useVeritieCaptureLease();

    return (
        <VoiceCapturePanel
            veritie={veritie}
            captureHandle={captureHandle}
            leasePhase={leasePhase}
            leaseError={leaseError}
            renewLease={renewLease}
            embedded
            onBack={onBack}
            onComplete={onComplete}
        />
    );
}
