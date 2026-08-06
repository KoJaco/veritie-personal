import type { EvidenceIndexArtifact } from "@veritie/sdk";

import type { IndexedExtractionProps } from "@/lib/evidence-index/types";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";

export function mapCaptureDetailToIndexedProps(
    detail: CaptureDetailReadModel,
    audioUrl: string | null = null,
): IndexedExtractionProps {
    const transcript = detail.voiceLog?.transcriptText
        ? {
              text: detail.voiceLog.transcriptText,
              language: detail.voiceLog.language,
              duration_ms: detail.voiceLog.durationMs,
              segments: detail.segments.map((segment) => ({
                  id: segment.id,
                  index: segment.index,
                  start_ms: segment.startMs,
                  end_ms: segment.endMs,
                  text: segment.text,
                  confidence: segment.confidence,
              })),
          }
        : null;

    const extractionPayload = detail.voiceLog?.extractionPayload;
    const extraction =
        extractionPayload && typeof extractionPayload === "object"
            ? (extractionPayload as Record<string, unknown>)
            : {};

    const indexArtifact = detail.voiceLog?.indexArtifact;
    const index =
        indexArtifact && typeof indexArtifact === "object"
            ? (indexArtifact as unknown as EvidenceIndexArtifact)
            : null;

    return {
        extraction,
        index,
        transcript,
        audioUrl,
    };
}
