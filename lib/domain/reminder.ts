import type { AspectKey } from "./aspect";

export type ReminderStatus = "active" | "completed" | "cancelled" | "snoozed";

export type ReminderTargetType =
    | "task"
    | "goal"
    | "money_entry"
    | "record"
    | "resource";

export interface Reminder {
    id: string;
    title: string;
    remindAt: string;
    recurrence?: string;
    aspect: AspectKey;
    status: ReminderStatus;
    targetType?: ReminderTargetType;
    targetId?: string;
    sourceCaptureIds: string[];
    sourceValueIds: string[];
    createdAt: string;
    updatedAt: string;
}
