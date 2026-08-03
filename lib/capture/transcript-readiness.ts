import type { JobDetailResponse } from "@veritie/sdk";

function hasTranscriptText(job: JobDetailResponse): boolean {
    return Boolean(job.transcript?.text?.trim());
}

export function isTranscriptReady(job: JobDetailResponse): boolean {
    if (hasTranscriptText(job)) {
        return true;
    }

    return job.transcript_ready === true && hasTranscriptText(job);
}

export function isTranscriptPending(job: JobDetailResponse): boolean {
    return !isTranscriptReady(job);
}
