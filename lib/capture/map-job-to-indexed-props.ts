import type { JobDetailResponse } from "@veritie/sdk";

import type { IndexedExtractionProps } from "@/lib/evidence-index/types";

export function mapJobToIndexedProps(
    job: JobDetailResponse,
    audioUrl: string | null = null,
): IndexedExtractionProps {
    const transcript = job.transcript
        ? {
              text: job.transcript.text,
              language: job.transcript.language,
              duration_ms: job.transcript.duration_ms,
              segments: job.transcript.segments?.map((segment, index) => ({
                  id: `segment-${segment.index ?? index}`,
                  index: segment.index ?? index,
                  start_ms: segment.start_ms ?? 0,
                  end_ms: segment.end_ms ?? 0,
                  text: segment.text ?? "",
                  confidence: segment.confidence,
              })),
          }
        : null;

    const extractionPayload = job.extraction?.payload ?? {};

    return {
        extraction: extractionPayload as Record<string, unknown>,
        index: job.index ?? null,
        transcript,
        audioUrl,
    };
}

export function buildCaptureAudioPlaybackUrl(captureId: string): string {
    return `/api/captures/${encodeURIComponent(captureId)}/audio`;
}
