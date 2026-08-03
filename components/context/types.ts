import type { ScopeLens } from "@/lib/lens";

export type RailTabKey = "assistant" | "context";

export type RouteId =
    | "work"
    | "scopes_index"
    | "scopes_operations_readiness"
    | "scopes_delivery_observability"
    | "scopes_workspace_resilience"
    | "scopes_knowledge_hygiene"
    | "scope_checks_index"
    | "scope_check_detail"
    | "documents_index"
    | "documents_detail"
    | "resources_index"
    | "resources_detail"
    | "task_index"
    | "task_detail"
    | "connections_index"
    | "connections_detail"
    | "settings"
    | "unknown";

export type RailTab = {
    key: RailTabKey;
    label: string;
};

export type PrimaryObject =
    | {
          type: "task";
          id: string;
      }
    | {
          type: "attachment";
          id: string;
      }
    | {
          type: "check";
          id: string;
      }
    | {
          type: "artifact";
          id: string;
      }
    | {
          type: "resource";
          id: string;
      };

// Use this to set scope in each page appropriately
export type RailScope =
    | { type: "work" }
    | { type: "scopes_index" }
    | { type: "scopes_operations_readiness" }
    | { type: "scopes_delivery_observability" }
    | { type: "scopes_workspace_resilience" }
    | { type: "scopes_knowledge_hygiene" }
    | { type: "scope_checks_index" }
    | { type: "scope_check_detail"; id: string }
    | { type: "task_index" }
    | { type: "task_detail"; id: string }
    | { type: "documents_index" }
    | { type: "documents_detail"; id: string }
    | { type: "resources_index" }
    | { type: "resources_detail"; id: string }
    | { type: "connections_index" }
    | { type: "connections_detail"; id: string }
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
    kind: "task" | "attachment" | "object" | "scope" | "check";
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
