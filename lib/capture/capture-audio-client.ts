import { buildCaptureAudioPlaybackUrl } from "@/lib/capture/map-job-to-indexed-props";

export async function uploadCaptureAudio(
    captureId: string,
    audioBlob: Blob,
): Promise<void> {
    const formData = new FormData();
    formData.append(
        "audio",
        audioBlob,
        `${captureId}.webm`,
    );

    const response = await fetch(
        `/api/captures/${encodeURIComponent(captureId)}/audio`,
        {
            method: "POST",
            body: formData,
        },
    );

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
        throw new Error(payload?.error ?? "Failed to upload capture audio");
    }
}

export async function fetchCaptureAudioPlaybackUrl(
    captureId: string,
): Promise<string | null> {
    const response = await fetch(buildCaptureAudioPlaybackUrl(captureId));
    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as { url?: string };
    return payload.url ?? null;
}

export async function getVoiceLogPreferences(): Promise<{
    saveVoiceLogAudio: boolean;
}> {
    const response = await fetch("/api/capture/preferences");
    if (!response.ok) {
        return { saveVoiceLogAudio: false };
    }
    return (await response.json()) as { saveVoiceLogAudio: boolean };
}
