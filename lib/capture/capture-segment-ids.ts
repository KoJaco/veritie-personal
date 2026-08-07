import type { EvidenceIndexArtifact } from "@veritie/sdk";

/** Stable per-capture segment id for DB persistence (globally unique). */
export function buildCaptureSegmentId(
    captureId: string,
    segmentIndex: number,
): string {
    return `segment_${captureId}_${segmentIndex}`;
}

/** Veritie index artifacts reference `segment-{index}`; remap for persisted segments. */
export function remapIndexArtifactSegmentIds(
    index: EvidenceIndexArtifact | null | undefined,
    captureId: string,
): EvidenceIndexArtifact | null {
    if (!index) {
        return null;
    }

    return {
        ...index,
        entries: index.entries.map((entry) => ({
            ...entry,
            segment_ids: entry.segment_ids.map((segmentId) => {
                const match = /^segment-(\d+)$/.exec(segmentId);
                if (match) {
                    return buildCaptureSegmentId(
                        captureId,
                        Number.parseInt(match[1], 10),
                    );
                }
                return segmentId;
            }),
        })),
    };
}
