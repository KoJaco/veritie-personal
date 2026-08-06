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
        prepareLeaseForRecording,
        renewLease,
    } = useVeritieCaptureLease();

    return (
        <VoiceCapturePanel
            veritie={veritie}
            captureHandle={captureHandle}
            leasePhase={leasePhase}
            leaseError={leaseError}
            prepareLeaseForRecording={prepareLeaseForRecording}
            renewLease={renewLease}
            embedded
            onBack={onBack}
            onComplete={onComplete}
            saveVoiceLogAudio={saveVoiceLogAudio}
            captureLocationLabel={captureLocationLabel}
        />
    );
}
