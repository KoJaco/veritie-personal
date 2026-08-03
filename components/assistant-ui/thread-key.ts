import type { RailContextPayload, RouteId } from "@/components/context/types";

export function getThreadKey(
    routeId: RouteId,
    ctx?: RailContextPayload,
): string {
    const scope = ctx?.scope;
    if (!scope) return routeId;

    const scopeMatchesRoute = (() => {
        switch (routeId) {
            case "timeline":
                return scope.type === "timeline";
            case "captures_index":
                return scope.type === "captures_index";
            case "capture_detail":
                return scope.type === "capture_detail";
            case "task_detail":
                return scope.type === "task_detail";
            case "task_index":
                return scope.type === "task_index";
            case "records_detail":
                return scope.type === "records_detail";
            case "records_index":
                return scope.type === "records_index";
            case "resources_detail":
                return scope.type === "resources_detail";
            case "resources_index":
                return scope.type === "resources_index";
            case "settings":
                return scope.type === "settings";
            default:
                return false;
        }
    })();

    if (!scopeMatchesRoute) {
        return routeId;
    }

    switch (scope.type) {
        case "timeline":
            return "timeline";
        case "captures_index":
            return "captures:index";
        case "capture_detail":
            return `capture:${scope.id}`;
        case "task_detail":
            return `task:${scope.id}`;
        case "task_index":
            return "task:index";
        case "records_index":
            return "records:index";
        case "records_detail":
            return `record:${scope.id}`;
        case "resources_index":
            return "resource:index";
        case "resources_detail":
            return `resource:${scope.id}`;
        case "settings":
            return "settings";
        default:
            return routeId;
    }
}
