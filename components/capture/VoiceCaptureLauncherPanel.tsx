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
    saveVoiceLogAudio = false,
}: {
    onBack: () => void;
    onComplete: () => void;
    saveVoiceLogAudio?: boolean;
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
            saveVoiceLogAudio={saveVoiceLogAudio}
        />
    );
}
