import type {
    ResourceCategory,
    ResourceCriticality,
    ResourceSensitivity,
} from "@/lib/stubs";
import { getScopeLabel } from "@/lib/lens/scope-definitions";
import type { ScopeKey } from "@/lib/lens";

export function resourceCategoryLabel(category: ResourceCategory): string {
    switch (category) {
        case "device":
            return "Device";
        case "service":
            return "Service";
        case "resource":
            return "Resource";
        case "entity":
            return "Entity";
    }
}

export function resourceCriticalityLabel(value: ResourceCriticality): string {
    switch (value) {
        case "low":
            return "Low";
        case "medium":
            return "Medium";
        case "high":
            return "High";
        case "critical":
            return "Critical";
    }
}

export function resourceSensitivityLabel(value: ResourceSensitivity): string {
    switch (value) {
        case "public":
            return "Public";
        case "internal":
            return "Internal";
        case "restricted":
            return "Restricted";
    }
}

export function scopeLabel(scopeId: ScopeKey): string {
    return getScopeLabel(scopeId);
}
