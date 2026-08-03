import {
    ASPECT_DEFINITIONS,
    type AspectDefinition,
    type AspectId,
    type AspectKey,
} from "@/lib/domain/aspect";

const ASPECT_MAP = new Map(ASPECT_DEFINITIONS.map((a) => [a.id, a]));

export function getAspectDefinition(id: AspectId): AspectDefinition | undefined {
    if (id === "all") return undefined;
    return ASPECT_MAP.get(id);
}

export function getAspectLabel(id: AspectId): string {
    if (id === "all") return "All aspects";
    return getAspectDefinition(id)?.label ?? id;
}

export function aspectIdsToLabels(aspectIds: AspectKey[]): string[] {
    return aspectIds.map((id) => getAspectLabel(id));
}

export function isAspectId(value: string | null | undefined): value is AspectId {
    return (
        value === "all" ||
        value === "finance" ||
        value === "fitness" ||
        value === "work" ||
        value === "personal" ||
        value === "admin"
    );
}

export { ASPECT_DEFINITIONS };
