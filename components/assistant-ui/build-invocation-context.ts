import type {
    FocusContext,
    RailContextPayload,
    RailScope,
    RouteId,
} from "@/components/context/types";
import type { ScopeLens } from "@/lib/lens";

export type AssistantInvocationContextV0 = {
    schemaVersion: "assistant_invocation_context_v0";
    route: {
        routeId: RouteId;
        scopeType?: RailScope["type"];
        scopeId?: string;
    };
    focus: FocusContext | null;
    snapshot: {
        lens?: ScopeLens;
        primaryObject?: RailContextPayload["primaryObject"];
        asOf?: string;
    };
    meta: {
        builtAt: string;
        threadKey: string;
        source: "frontend_stub";
    };
};

type BuildInvocationContextParams = {
    routeId: RouteId;
    routeContext: RailContextPayload | null;
    focusContext: FocusContext | null;
    threadKey: string;
};

function stripUndefinedFields<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as T;
}

function getScopeId(scope: RailScope | undefined): string | undefined {
    if (!scope) return undefined;
    switch (scope.type) {
        case "task_detail":
        case "records_detail":
        case "resources_detail":
        case "capture_detail":
            return scope.id;
        default:
            return undefined;
    }
}

export function buildInvocationContext({
    routeId,
    routeContext,
    focusContext,
    threadKey,
}: BuildInvocationContextParams): AssistantInvocationContextV0 {
    const scope = routeContext?.scope;
    const data = routeContext?.data;

    return {
        schemaVersion: "assistant_invocation_context_v0",
        route: stripUndefinedFields({
            routeId,
            scopeType: scope?.type,
            scopeId: getScopeId(scope),
        }),
        focus: focusContext,
        snapshot: stripUndefinedFields({
            lens: data?.lens ? stripUndefinedFields(data.lens) : undefined,
            primaryObject: routeContext?.primaryObject,
            asOf: data?.asOf,
        }),
        meta: {
            builtAt: new Date().toISOString(),
            threadKey,
            source: "frontend_stub",
        },
    };
}
