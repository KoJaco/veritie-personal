import { persistCaptureAction } from "@/lib/actions/stub-data-mutations";

/** Client-callable wrapper so tests can mock without server-action transforms. */
export async function persistCaptureForVoiceFlow(jobId: string) {
    return persistCaptureAction(jobId);
}
