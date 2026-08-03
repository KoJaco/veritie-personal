"use client";

import dynamic from "next/dynamic";
import { useVeritie } from "@veritie/sdk";
import { envPublic } from "@/lib/config/env.public";

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
    const veritie = useVeritie({
        config: {
            baseUrl: envPublic.veritieApiUrl ?? "http://localhost:3001",
            pipelineAlias:
                envPublic.veritiePipelineAlias ?? "veritie-personal",
        },
    });

    return (
        <VoiceCapturePanel
            veritie={veritie}
            embedded
            onBack={onBack}
            onComplete={onComplete}
        />
    );
}
