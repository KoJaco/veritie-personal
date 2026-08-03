import type { ScopeLens } from "@/lib/lens";

export type RailTabKey = "assistant" | "context";

export type RouteId =
    | "timeline"
    | "captures_index"
    | "capture_detail"
    | "goals_index"
    | "money_index"
    | "task_index"
    | "task_detail"
    | "records_index"
    | "records_detail"
    | "resources_index"
    | "resources_detail"
    | "settings"
    | "unknown";

export type RailTab = {
    key: RailTabKey;
    label: string;
};

export type PrimaryObject =
    | { type: "task"; id: string }
    | { type: "attachment"; id: string }
    | { type: "capture"; id: string }
    | { type: "artifact"; id: string }
    | { type: "resource"; id: string }
    | { type: "timeline_event"; id: string };

export type RailScope =
    | { type: "timeline" }
    | { type: "captures_index" }
    | { type: "capture_detail"; id: string }
    | { type: "task_index" }
    | { type: "task_detail"; id: string }
    | { type: "records_index" }
    | { type: "records_detail"; id: string }
    | { type: "resources_index" }
    | { type: "resources_detail"; id: string }
    | { type: "settings" };

export type RailContextPayload = {
    scope: RailScope;
    primaryObject?: PrimaryObject;
    data?: RailContextData;
};

export type TopBlockingTaskSummary = {
    id: string;
    title: string;
};

export type ReadinessSnapshot = {
    blockedChecks: number;
    overdueTasks: number;
    missingAttachments: number;
    tasksTotal?: number;
    tasksInScope?: number;
    unmappedChecks?: number;
    criteriaSetStatus?: "valid" | "invalid";
    windowStatus?: "valid" | "invalid";
    coverageGapDays?: number;
};

export type RailContextData = {
    asOf?: string;
    timezone?: string;
    lens?: ScopeLens;
    snapshot?: ReadinessSnapshot;
    topBlockingTaskIds?: string[];
    topBlockingTaskSummaries?: TopBlockingTaskSummary[];
    scopesInView?: string[];
};

export type RailContract = {
    contractVersion: 1;
    routeId: RouteId;
    enabled: boolean;
    showTrigger: boolean;
    defaultTab: RailTabKey;
    tabs: RailTab[];
    context?: RailContextPayload;
};

export type RouteConfig = {
    routeId: RouteId;
    enabled: boolean;
    showTrigger: boolean;
    defaultTab: RailTabKey;
    tabs: RailTab[];
};

export type FocusEntityPointer = {
    kind: "task" | "attachment" | "object" | "capture" | "timeline_event";
    id: string;
};

export type FocusSubviewPointer = {
    kind: "panel" | "tab" | "section";
    id: string;
};

export type FocusIntent = "review" | "summarize" | "triage" | "explain";

export type FocusContext = {
    entityPointer?: FocusEntityPointer;
    subviewPointer?: FocusSubviewPointer;
    intent?: FocusIntent;
};
