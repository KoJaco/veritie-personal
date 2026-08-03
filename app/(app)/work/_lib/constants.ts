import type { TaskStub } from "@/lib/stubs";

export const DASHBOARD_PRIORITY_WEIGHT: Record<TaskStub["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
};

export const DASHBOARD_COVERAGE_GAP_RISK_DAYS = 14;
export const DASHBOARD_COVERAGE_GAP_WARNING_MIN_DAYS = 1;
export const DASHBOARD_BLOCKED_CHECK_GAP_WEIGHT = 3;
export const DASHBOARD_OVERDUE_TASK_GAP_WEIGHT = 2;
