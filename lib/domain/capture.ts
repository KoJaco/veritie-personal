import type { AspectKey } from "./aspect";

export type CaptureType =
    | "voice"
    | "pdf"
    | "image"
    | "text"
    | "assistant_generated";

export type CaptureStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "partial";

export type CaptureSourceKind = "audio" | "pdf" | "image" | "text" | "markdown";

export interface Capture {
    id: string;
    type: CaptureType;
    status: CaptureStatus;
    title?: string;
    aspectIds: AspectKey[];
    createdAt: string;
    updatedAt: string;
    veritieJobId?: string;
}

export interface CaptureSource {
    id: string;
    captureId: string;
    kind: CaptureSourceKind;
    uri?: string;
    mimeType?: string;
    fileName?: string;
    sizeBytes?: number;
    createdAt: string;
}

export interface VoiceLog {
    id: string;
    captureId: string;
    transcriptText?: string;
    language?: string;
    durationMs?: number;
    audioUri?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TranscriptSegment {
    id: string;
    voiceLogId: string;
    index: number;
    startMs: number;
    endMs: number;
    text: string;
    speakerLabel?: string;
    confidence?: number;
}
