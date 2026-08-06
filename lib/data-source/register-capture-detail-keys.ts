import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { registerExtractionListKeysFromPayload } from "@/lib/capture/register-extraction-payload-keys";

/** Register dynamic list keys from capture detail payload before ID parsing/edits. */
export function registerCaptureDetailExtractionKeys(
    detail: CaptureDetailReadModel | null,
): CaptureDetailReadModel | null {
    if (!detail) {
        return null;
    }

    registerExtractionListKeysFromPayload(
        detail.voiceLog?.extractionPayload ?? null,
    );
    return detail;
}
