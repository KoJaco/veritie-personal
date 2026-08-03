import type { TimelineEventType } from "@/lib/domain/timeline";
import { TIMELINE_SIGNAL_EVENT_TYPES } from "@/lib/domain/timeline-filters";

export type SearchParamValue = string | string[] | undefined;

export function getStringParam(value: SearchParamValue): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

export function getStringParamOrEmpty(value: SearchParamValue): string {
    return getStringParam(value) ?? "";
}

export function parseTimelineEventType(
    value: string | undefined,
): TimelineEventType | undefined {
    if (!value) return undefined;
    return TIMELINE_SIGNAL_EVENT_TYPES.includes(value as TimelineEventType)
        ? (value as TimelineEventType)
        : undefined;
}

export function parseReviewState(
    value: string | undefined,
): "pending" | "confirmed" | "rejected" | "edited" | undefined {
    if (
        value === "pending" ||
        value === "confirmed" ||
        value === "rejected" ||
        value === "edited"
    ) {
        return value;
    }
    return undefined;
}

export function parseCaptureStatus(
    value: string | undefined,
): "completed" | "processing" | "failed" | undefined {
    if (value === "completed" || value === "processing" || value === "failed") {
        return value;
    }
    return undefined;
}

export function parseCapturesSortBy(
    value: string | undefined,
): "createdAt" | "title" | "extractedCount" {
    if (value === "title" || value === "extractedCount") return value;
    return "createdAt";
}

export function parseSortDir(value: string | undefined): "asc" | "desc" {
    return value === "asc" ? "asc" : "desc";
}

export function parseCapturesView(value: string | undefined): "cards" | "table" {
    return value === "table" ? "table" : "cards";
}

export const INDEX_SEARCH_SUGGESTION_LIMIT = 50;
