"use client";

import { useMemo } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { useContextPayloadStore } from "./context-payload-store";
import { getRouteConfig } from "./route-config-registry";
import type { RailContract, RouteId } from "./types";
import { logger } from "@/lib/logging/client-logger";

export function useRailContract(): RailContract {
    const segments = useSelectedLayoutSegments();

    const contextPayload = useContextPayloadStore(
        (state) => state.contextPayload,
    );

    logger.debug("[rail] contract_inputs", {
        segments,
        contextScope: contextPayload?.scope ?? null,
    });

    return useMemo(() => {
        // RouteId derived from segments only to avoid payload hydration mismatch.

        let routeId: RouteId = "work";

        if (segments.length === 0) {
            routeId = "work";
        } else {
            switch (segments[0]) {
                case "tasks":
                    routeId = segments.length >= 2 ? "task_detail" : "task_index";
                    break;
                case "documents":
                    routeId =
                        segments.length >= 2
                            ? "documents_detail"
                            : "documents_index";
                    break;
                case "resources":
                    routeId =
                        segments.length >= 2
                            ? "resources_detail"
                            : "resources_index";
                    break;
                case "connections":
                    routeId =
                        segments.length >= 2
                            ? "connections_detail"
                            : "connections_index";
                    break;
                case "settings":
                    routeId = "settings";
                    break;
                case "scopes":
                    if (segments.includes("checks")) {
                        routeId =
                            segments[segments.length - 1] === "checks"
                                ? "scope_checks_index"
                                : "scope_check_detail";
                    } else if (segments[1] === "delivery-observability") {
                        routeId = "scopes_delivery_observability";
                    } else if (segments[1] === "operations-readiness") {
                        routeId = "scopes_operations_readiness";
                    } else if (segments[1] === "workspace-resilience") {
                        routeId = "scopes_workspace_resilience";
                    } else if (segments[1] === "knowledge-hygiene") {
                        routeId = "scopes_knowledge_hygiene";
                    } else {
                        routeId = "scopes_index";
                    }
                    break;
                default:
                    routeId = "unknown";
                    break;
            }
        }

        // Unkown is a deliberate contract, don't need fallback policy.
        const routeConfig = getRouteConfig(routeId);

        const contract: RailContract = {
            routeId: routeId,
            contractVersion: 1,
            enabled: routeConfig.enabled,
            showTrigger: routeConfig.showTrigger,
            defaultTab: routeConfig.defaultTab,
            tabs: routeConfig.tabs,
            context: contextPayload || undefined,
        };


        logger.debug("[rail] contract_output", {
            routeId,
            contextScope: contract.context?.scope ?? null,
        });

        return contract;
    }, [segments, contextPayload]);
}
