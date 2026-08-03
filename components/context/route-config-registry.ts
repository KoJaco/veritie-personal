import type { RouteId, RouteConfig } from "./types";

export const ROUTE_CONFIGS: Record<RouteId, RouteConfig> = {
    scopes_index: {
        routeId: "scopes_index",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    scopes_operations_readiness: {
        routeId: "scopes_operations_readiness",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    scopes_delivery_observability: {
        routeId: "scopes_delivery_observability",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    scopes_workspace_resilience: {
        routeId: "scopes_workspace_resilience",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    scopes_knowledge_hygiene: {
        routeId: "scopes_knowledge_hygiene",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    scope_checks_index: {
        routeId: "scope_checks_index",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    scope_check_detail: {
        routeId: "scope_check_detail",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    task_index: {
        routeId: "task_index",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    task_detail: {
        routeId: "task_detail",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    documents_index: {
        routeId: "documents_index",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    documents_detail: {
        routeId: "documents_detail",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    resources_index: {
        routeId: "resources_index",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    resources_detail: {
        routeId: "resources_detail",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    work: {
        routeId: "work",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    connections_index: {
        routeId: "connections_index",
        enabled: true,
        showTrigger: true,
        defaultTab: "assistant",
        tabs: [
            { key: "assistant", label: "Assistant" },
            { key: "context", label: "Context" },
        ],
    },
    connections_detail: {
        routeId: "connections_detail",
        enabled: true,
        showTrigger: true,
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
