import type { TimelineEventType } from "@/lib/domain/timeline";

/** Meta events hidden from the default timeline feed. */
export const HIDDEN_TIMELINE_EVENT_TYPES: TimelineEventType[] = [
    "capture_created",
    "extraction_completed",
];

export const TIMELINE_SIGNAL_EVENT_TYPES: TimelineEventType[] = [
    "task_detected",
    "reminder_detected",
    "goal_detected",
    "goal_progress_detected",
    "expense_detected",
    "record_detected",
    "resource_detected",
];

export function isHiddenTimelineEventType(type: TimelineEventType): boolean {
    return HIDDEN_TIMELINE_EVENT_TYPES.includes(type);
}
