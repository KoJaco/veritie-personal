import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { ScopeLens } from "@/lib/lens";

type ScopesRouteId =
    | "scopes_index"
    | "scopes_operations_readiness"
    | "scopes_workspace_resilience"
    | "scopes_knowledge_hygiene"
    | "scopes_delivery_observability";

type BuildScopesRouteContractParams = {
    scope: ScopesRouteId;
    lens?: ScopeLens;
};

export type ScopesRouteContract = {
    scope: ScopesRouteId;
    lens?: ScopeLens;
    railPayloadCandidate: RailContextPayload | null;
};

export function buildScopesRouteContract({
    scope,
    lens,
}: BuildScopesRouteContractParams): ScopesRouteContract {
    return {
        scope,
        lens,
        railPayloadCandidate: buildRailPayload({
            scope: { type: scope },
            lens,
        }),
    };
}
