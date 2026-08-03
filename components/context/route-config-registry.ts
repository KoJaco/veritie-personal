import type { RouteId, RouteConfig } from "./types";

export const ROUTE_CONFIGS: Record<RouteId, RouteConfig> = {
    timeline: {
        routeId: "timeline",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    captures_index: {
        routeId: "captures_index",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    capture_detail: {
        routeId: "capture_detail",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    goals_index: {
        routeId: "goals_index",
        enabled: false,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [],
    },
    money_index: {
        routeId: "money_index",
        enabled: false,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [],
    },
    task_index: {
        routeId: "task_index",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    task_detail: {
        routeId: "task_detail",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    records_index: {
        routeId: "records_index",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    records_detail: {
        routeId: "records_detail",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    resources_index: {
        routeId: "resources_index",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    resources_detail: {
        routeId: "resources_detail",
        enabled: true,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    settings: {
        routeId: "settings",
        enabled: false,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [{ key: "assistant", label: "Assistant" }],
    },
    unknown: {
        routeId: "unknown",
        enabled: false,
        showTrigger: false,
        defaultTab: "assistant",
        tabs: [],
    },
};

export function getRouteConfig(routeId: RouteId): RouteConfig {
    return ROUTE_CONFIGS[routeId];
}
