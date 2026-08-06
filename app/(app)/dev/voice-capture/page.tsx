import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { VoiceCaptureFlowSandbox } from "@/components/capture/VoiceCaptureFlowSandbox";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";

export default function VoiceCaptureSandboxPage() {
    return (
        <>
            <ContextPayloadSlot payload={null} />
            <PageFrame
                header={
                    <PageHeader
                        title="Voice capture sandbox"
                        description="Stubbed end-to-end flow for styling transcript, extraction, and indexed evidence UI."
                        separator={false}
                    />
                }
            >
                <VoiceCaptureFlowSandbox />
            </PageFrame>
        </>
    );
}
