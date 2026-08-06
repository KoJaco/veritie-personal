import type { CaptureJobCoordinatorInput } from "@/lib/capture/capture-job-coordinator";
import { captureJobCoordinator } from "@/lib/capture/capture-job-coordinator";
import { enrichCaptureForVoiceFlow } from "@/lib/capture/persist-capture-client";

export type CaptureBackgroundPipelineInput = CaptureJobCoordinatorInput & {
    onPersistError?: (error: unknown) => void;
    onEnrichError?: (error: unknown) => void;
};

export function enqueueCaptureBackgroundPipeline(
    input: CaptureBackgroundPipelineInput,
): void {
    captureJobCoordinator.start({
        ...input,
        enrichCaptureFn: input.enrichCaptureFn ?? enrichCaptureForVoiceFlow,
        onPersistError: input.onPersistError,
        onEnrichError: input.onEnrichError,
    });
}

/** Test helper */
export function resetCaptureBackgroundPipelineForTests(): void {
    captureJobCoordinator.resetForTests();
}

export function isCaptureJobInFlight(jobId: string): boolean {
    return captureJobCoordinator.isJobInFlight(jobId);
}
