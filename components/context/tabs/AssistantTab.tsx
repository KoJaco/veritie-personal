"use client";

import type { RailContextPayload } from "../types";
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantProvider } from "@/components/assistant-ui/AssistantProvider";
import { useRailContract } from "@/components/context/client-route-resolver";
import { getThreadKey } from "@/components/assistant-ui/thread-key";
import { logger } from "@/lib/logging/client-logger";
import { useEffect, useMemo, useState } from "react";
import { useAssistantRunStateStore } from "@/components/assistant-ui/assistant-run-state-store";
import { useChatStore } from "@/components/assistant-ui/chat-store";

interface AssistantTabProps {
    context?: RailContextPayload;
}

export function AssistantTab({ context }: AssistantTabProps) {
    const railContract = useRailContract();
    const threadKey = getThreadKey(railContract.routeId, railContract.context);
    const runPhase = useAssistantRunStateStore(
        (state) => state.threads[threadKey]?.phase ?? null,
    );
    const [hasHydrated, setHasHydrated] = useState(
        useChatStore.persist.hasHydrated(),
    );

    const scopeMatchesRoute = useMemo(() => {
        const scope = railContract.context?.scope;
        if (!scope) return false;
        switch (railContract.routeId) {
            case "task_detail":
                return scope.type === "task_detail";
            case "task_index":
                return scope.type === "task_index";
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
            case "scope_checks_index":
                return scope.type === "scope_checks_index";
            case "scope_check_detail":
                return scope.type === "scope_check_detail";
            case "settings":
                return scope.type === "settings";
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
                return true;
        }
    }, [railContract.routeId, railContract.context]);

    useEffect(() => {
        logger.debug("[assistant] tab", {
            routeId: railContract.routeId,
            scope: railContract.context?.scope,
            threadKey,
            runPhase,
            hasHydrated,
        });
    }, [
        railContract.routeId,
        railContract.context,
        threadKey,
        runPhase,
        hasHydrated,
    ]);

    useEffect(() => {
        if (hasHydrated) {
            return;
        }

        const unsub = useChatStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });

        return () => unsub();
    }, [hasHydrated]);

    const shouldRenderAssistant = scopeMatchesRoute && hasHydrated;
    const isLoading =
        !scopeMatchesRoute ||
        !hasHydrated ||
        runPhase === null ||
        runPhase === "hydrating" ||
        runPhase === "aligning";

    return (
        <div className="h-full min-h-0 flex-1 w-full flex flex-col overflow-hidden">
            {isLoading && (
                <div
                    data-testid="assistant-loading"
                    className="h-full w-full p-4 space-y-3 animate-pulse"
                    aria-label="Loading assistant"
                >
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-4 w-5/6 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
            )}
            {shouldRenderAssistant && (
                <AssistantProvider
                    threadKey={threadKey}
                    routeId={railContract.routeId}
                    context={context}
                >
                    <Thread threadKey={threadKey} />
                </AssistantProvider>
            )}
        </div>
    );
}
