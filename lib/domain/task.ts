import type { AspectKey } from "./aspect";

export type TaskStatus =
    | "inbox"
    | "todo"
    | "in_progress"
    | "waiting"
    | "done"
    | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
    id: string;
    title: string;
    notes?: string;
    aspect: AspectKey;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt?: string;
    scheduledFor?: string;
    waitingOn?: string;
    sourceCaptureIds: string[];
    sourceValueIds: string[];
    relatedGoalIds: string[];
    relatedResourceIds: string[];
    relatedRecordIds: string[];
    createdAt: string;
    updatedAt: string;
}
