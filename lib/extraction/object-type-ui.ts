import type { LucideIcon } from "lucide-react";
import {
    Bell,
    Boxes,
    Calendar,
    ListTodo,
    ServerCog,
    Target,
    Wallet,
} from "lucide-react";

import { formatObjectTypeLabel } from "@/lib/capture/extraction-summary";
import type { ExtractedObjectType } from "@/lib/domain/extraction";
import type { TimelineEventType } from "@/lib/domain/timeline";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";

export const OBJECT_TYPE_ICONS: Record<ExtractedObjectType, LucideIcon> = {
    task: ListTodo,
    reminder: Bell,
    goal: Target,
    goal_progress: Target,
    money_entry: Wallet,
    event: Calendar,
    record: Boxes,
    resource: ServerCog,
};

const TIMELINE_EVENT_TO_OBJECT_TYPE: Partial<
    Record<TimelineEventType, ExtractedObjectType>
> = {
    task_detected: "task",
    reminder_detected: "reminder",
    goal_detected: "goal",
    goal_progress_detected: "goal_progress",
    expense_detected: "money_entry",
    event_detected: "event",
    record_detected: "record",
    resource_detected: "resource",
};

export function getObjectTypeBadgeLabel(objectType: ExtractedObjectType): string {
    if (objectType === "money_entry") {
        return "Money";
    }
    if (objectType === "goal_progress") {
        return "Goal progress";
    }
    const label = formatObjectTypeLabel(objectType);
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export function resolveTimelineItemObjectType(
    item: Pick<
        TimelineIndexItem,
        "type" | "extractedObjectType" | "extractedValue"
    >,
): ExtractedObjectType | null {
    if (item.extractedObjectType) {
        return item.extractedObjectType;
    }
    if (item.extractedValue?.objectType) {
        return item.extractedValue.objectType;
    }
    return TIMELINE_EVENT_TO_OBJECT_TYPE[item.type] ?? null;
}
