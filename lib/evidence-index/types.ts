export type {
    EvidenceIndexArtifact,
    EvidenceIndexEntry,
    TranscriptArtifact,
} from "@veritie/sdk";

import type {
    EvidenceIndexArtifact,
    TranscriptArtifact,
} from "@veritie/sdk";

export interface IndexedTranscriptSegment {
    id?: string;
    index?: number;
    start_ms: number;
    end_ms: number;
    text: string;
    confidence?: number;
}

export interface IndexedTranscriptArtifact extends Omit<
    TranscriptArtifact,
    "segments"
> {
    segments?: IndexedTranscriptSegment[];
}

export interface IndexedExtractionProps {
    extraction: Record<string, unknown>;
    index: EvidenceIndexArtifact | null;
    transcript: IndexedTranscriptArtifact | null;
    audioUrl: string | null;
}

export type IndexedInteractionState = {
    activePath: string | null;
    activeEntryIndex: number;
    hoverPath: string | null;
    hoverEntryIndex: number;
    requestedSeekMs: number | null;
};

export const INITIAL_INTERACTION_STATE: IndexedInteractionState = {
    activePath: null,
    activeEntryIndex: 0,
    hoverPath: null,
    hoverEntryIndex: 0,
    requestedSeekMs: null,
};
