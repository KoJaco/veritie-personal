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
    captureLocationLabel = "",
}: {
    onBack: () => void;
    onComplete: () => void;
    saveVoiceLogAudio?: boolean;
    captureLocationLabel?: string;
}) {
    const {
        veritie,
        captureHandle,
        leasePhase,
        leaseError,
        prepareLease,
        getOrPrepareLease,
        renewLease,
        extractionConfig,
    } = useVeritieCaptureLease();

    return (
        <VoiceCapturePanel
            veritie={veritie}
            captureHandle={captureHandle}
            leasePhase={leasePhase}
            leaseError={leaseError}
            prepareLease={prepareLease}
            getOrPrepareLease={getOrPrepareLease}
            renewLease={renewLease}
            embedded
            onBack={onBack}
            onComplete={onComplete}
            saveVoiceLogAudio={saveVoiceLogAudio}
            captureLocationLabel={captureLocationLabel}
            glossaryLabels={extractionConfig.glossaryLabels}
        />
    );
}
