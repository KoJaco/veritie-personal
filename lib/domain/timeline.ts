import type { AspectKey } from "./aspect";
import type { ExtractedObjectType, ReviewState } from "./extraction";

export type TimelineEventType =
    | "capture_created"
    | "extraction_completed"
    | "task_detected"
    | "reminder_detected"
    | "goal_detected"
    | "goal_progress_detected"
    | "expense_detected"
    | "record_detected"
    | "resource_detected";

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    title: string;
    summary?: string;
    aspect: AspectKey;
    occurredAt: string;
    captureId?: string;
    extractedValueId?: string;
    extractedObjectType?: ExtractedObjectType;
    reviewState?: ReviewState;
    confidence?: number;
    createdAt: string;
}
