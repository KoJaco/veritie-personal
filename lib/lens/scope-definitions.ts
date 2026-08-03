import type { ScopeId, ScopeKey } from "./types";

export type ScopeDefinition = {
    id: ScopeKey;
    label: string;
    shortLabel: string;
    description: string;
};

export const SCOPE_DEFINITIONS: ScopeDefinition[] = [
    {
        id: "operations-readiness",
        label: "Operations Readiness",
        shortLabel: "Readiness",
        description:
            "Foundational operating checks for ownership, approvals, and baseline execution.",
    },
    {
        id: "delivery-observability",
        label: "Delivery Observability",
        shortLabel: "Observability",
        description:
            "Ongoing workflow visibility, recurring validation, and run-state coverage.",
    },
    {
        id: "workspace-resilience",
        label: "Workspace Resilience",
        shortLabel: "Resilience",
        description:
            "Operational safeguards and recovery readiness across shared systems.",
    },
    {
        id: "knowledge-hygiene",
        label: "Knowledge Hygiene",
        shortLabel: "Knowledge",
        description:
            "Structured documentation, handoff quality, and durable operating knowledge.",
    },
];

const SCOPE_MAP = new Map(SCOPE_DEFINITIONS.map((scope) => [scope.id, scope]));

export function getScopeDefinition(
    id: ScopeId,
): ScopeDefinition | undefined {
    if (id === "all") return undefined;
    return SCOPE_MAP.get(id);
}

export function getScopeLabel(id: ScopeId): string {
    if (id === "all") return "All scopes";
    return getScopeDefinition(id)?.label ?? id;
}

export function scopeIdsToLabels(scopeIds: ScopeKey[]): string[] {
    return scopeIds.map((scopeId) => getScopeLabel(scopeId));
}

export function isScopeId(value: string | null | undefined): value is ScopeId {
    return (
        value === "all" ||
        value === "operations-readiness" ||
        value === "delivery-observability" ||
        value === "workspace-resilience" ||
        value === "knowledge-hygiene"
    );
}

export function mapLegacyLensToScope(
    framework: string | null | undefined,
    mode: string | null | undefined,
): ScopeId | null {
    if (!framework || framework === "all") return "all";
    if (framework === "SOC2" && mode === "TYPE_II") {
        return "delivery-observability";
    }
    if (framework === "SOC2") {
        return "operations-readiness";
    }
    if (framework === "E8") {
        return "workspace-resilience";
    }
    if (framework === "ISO27001") {
        return "knowledge-hygiene";
    }
    return null;
}
