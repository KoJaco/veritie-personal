import type { RailContextPayload, RouteId } from "@/components/context/types";

export function getThreadKey(
    routeId: RouteId,
    ctx?: RailContextPayload,
): string {
    const scope = ctx?.scope;
    if (!scope) return routeId;

    const scopeMatchesRoute = (() => {
        switch (routeId) {
            case "task_detail":
                return scope.type === "task_detail";
            case "documents_detail":
                return scope.type === "documents_detail";
            case "documents_index":
                return scope.type === "documents_index";
            case "resources_detail":
                return scope.type === "resources_detail";
            case "resources_index":
                return scope.type === "resources_index";
            case "connections_index":
                return scope.type === "connections_index";
            case "connections_detail":
                return scope.type === "connections_detail";
            case "settings":
                return scope.type === "settings";
            case "scope_checks_index":
                return scope.type === "scope_checks_index";
            case "scope_check_detail":
                return scope.type === "scope_check_detail";
            case "scopes_index":
                return scope.type === "scopes_index";
            case "scopes_operations_readiness":
                return scope.type === "scopes_operations_readiness";
            case "scopes_delivery_observability":
                return scope.type === "scopes_delivery_observability";
            case "scopes_workspace_resilience":
                return scope.type === "scopes_workspace_resilience";
            case "scopes_knowledge_hygiene":
                return scope.type === "scopes_knowledge_hygiene";
            case "work":
                return scope.type === "work";
            default:
                return false;
        }
    })();

    if (!scopeMatchesRoute) {
        return routeId;
    }

    switch (scope.type) {
        case "task_detail":
            return `task:${scope.id}`;
        case "documents_index":
            return "document:index";
        case "documents_detail":
            return `document:${scope.id}`;
        case "resources_index":
            return "resource:index";
        case "resources_detail":
            return `resource:${scope.id}`;
        case "connections_index":
            return "connections:index";
        case "connections_detail":
            return `connection:${scope.id}`;
        case "settings":
            return "settings";
        case "scopes_index":
            return "scopes:index";
        case "scopes_operations_readiness":
            return "scope:operations-readiness";
        case "scopes_delivery_observability":
            return "scope:delivery-observability";
        case "scopes_workspace_resilience":
            return "scope:workspace-resilience";
        case "scopes_knowledge_hygiene":
            return "scope:knowledge-hygiene";
        case "scope_checks_index":
            return "checks:index";
        case "scope_check_detail":
            return `check:${scope.id}`;
        case "work":
            return "work";
        default:
            return routeId;
    }
}
