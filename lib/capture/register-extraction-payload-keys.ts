import { registerExtractionListKeys } from "@/lib/capture/extracted-value-path";

/** Register list keys from a voice-log extraction payload (array-valued top-level keys). */
export function registerExtractionListKeysFromPayload(
    payload: Record<string, unknown> | null | undefined,
): void {
    if (!payload || typeof payload !== "object") {
        return;
    }

    const listKeys: string[] = [];
    for (const [key, value] of Object.entries(payload)) {
        if (Array.isArray(value)) {
            listKeys.push(key);
        }
    }

    if (listKeys.length > 0) {
        registerExtractionListKeys(listKeys);
    }
}
