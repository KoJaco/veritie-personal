import type { AspectKey } from "./aspect";

export type GoalStatus = "active" | "paused" | "completed" | "abandoned";

export type GoalTargetType = "binary" | "numeric" | "habit" | "milestone";

export interface Goal {
    id: string;
    title: string;
    aspect: AspectKey;
    status: GoalStatus;
    targetType: GoalTargetType;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    startDate?: string;
    targetDate?: string;
    cadence?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GoalProgressEntry {
    id: string;
    goalId: string;
    occurredAt: string;
    valueDelta?: number;
    valueSnapshot?: number;
    note?: string;
    confidence?: number;
    sourceCaptureIds: string[];
    sourceValueIds: string[];
    createdAt: string;
}
