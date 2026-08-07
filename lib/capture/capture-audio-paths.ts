export function buildJobAudioStoragePath(
    accountId: string,
    userId: string,
    jobId: string,
): string {
    return `${accountId}/${userId}/jobs/${jobId}/audio.webm`;
}

export function buildCaptureAudioStoragePath(
    accountId: string,
    userId: string,
    captureId: string,
): string {
    return `${accountId}/${userId}/${captureId}.webm`;
}
