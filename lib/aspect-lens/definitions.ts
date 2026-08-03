import { ASPECT_DEFINITIONS } from "@/lib/aspect/definitions";
import type { AspectDefinition, AspectId } from "@/lib/domain/aspect";

export function getAspectDefinitionForLens(id: AspectId): AspectDefinition | undefined {
    if (id === "all") return undefined;
    return ASPECT_DEFINITIONS.find((a) => a.id === id);
}

export { ASPECT_DEFINITIONS };
