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
        let routeId: RouteId = "timeline";

        if (segments.length === 0) {
            routeId = "timeline";
        } else {
            switch (segments[0]) {
                case "timeline":
                    routeId = "timeline";
                    break;
                case "captures":
                    routeId =
                        segments.length >= 2
                            ? "capture_detail"
                            : "captures_index";
                    break;
                case "goals":
                    routeId = "goals_index";
                    break;
                case "money":
                    routeId = "money_index";
                    break;
                case "tasks":
                    routeId = segments.length >= 2 ? "task_detail" : "task_index";
                    break;
                case "records":
                    routeId =
                        segments.length >= 2
                            ? "records_detail"
                            : "records_index";
                    break;
                case "resources":
                    routeId =
                        segments.length >= 2
                            ? "resources_detail"
                            : "resources_index";
                    break;
                case "settings":
                    routeId = "settings";
                    break;
                default:
                    routeId = "unknown";
                    break;
            }
        }

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
