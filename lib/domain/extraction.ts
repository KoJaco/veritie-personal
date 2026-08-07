import type { AspectKey } from "./aspect";

export type ExtractionRunStatus =
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "skipped";

export type ExtractedObjectType =
    | "task"
    | "reminder"
    | "goal"
    | "goal_progress"
    | "money_entry"
    | "event"
    | "record"
    | "resource";

export type ReviewState = "pending" | "confirmed" | "rejected" | "edited";

export interface SourceAnchor {
    id: string;
    extractedValueId: string;
    startMs?: number;
    endMs?: number;
    textStart?: number;
    textEnd?: number;
    quote?: string;
    segmentIds?: string[];
    confidence?: number;
}

export interface ExtractionRun {
    id: string;
    captureId: string;
    status: ExtractionRunStatus;
    schemaVersion?: string;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    createdAt: string;
}

export interface ExtractedValue {
    id: string;
    extractionRunId: string;
    captureId: string;
    objectType: ExtractedObjectType;
    aspect: AspectKey;
    title: string;
    fields: Record<string, unknown>;
    confidence: number;
    reviewState: ReviewState;
    sourceValueIds?: string[];
    createdAt: string;
    updatedAt: string;
}

/** Top-level extraction schema output from voice log pipeline. */
export interface ExtractionCandidate {
    title: string;
    aspect: AspectKey;
    fields: Record<string, unknown>;
    confidence: number;
    sourceAnchors: Array<{
        startMs?: number;
        endMs?: number;
        textStart?: number;
        textEnd?: number;
        quote?: string;
        segmentIds?: string[];
    }>;
}

export interface ExtractionPayload {
    capture_summary?: string;
    tasks: ExtractionCandidate[];
    reminders: ExtractionCandidate[];
    goals: ExtractionCandidate[];
    goal_progress: ExtractionCandidate[];
    money_entries: ExtractionCandidate[];
    events: ExtractionCandidate[];
    records: ExtractionCandidate[];
    resources: ExtractionCandidate[];
    extraction_warnings?: Array<Record<string, unknown>>;
    /** Legacy wire key; prefer money_entries. */
    expenses?: ExtractionCandidate[];
}
