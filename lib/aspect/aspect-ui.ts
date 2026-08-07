import type { LucideIcon } from "lucide-react";
import {
    Bell,
    Briefcase,
    Dumbbell,
    Heart,
    Wallet,
    ClipboardList,
} from "lucide-react";

import type { AspectKey } from "@/lib/domain/aspect";
import { getAspectDefinition } from "@/lib/aspect/definitions";

export const ASPECT_ICONS: Record<AspectKey, LucideIcon> = {
    finance: Wallet,
    fitness: Dumbbell,
    work: Briefcase,
    personal: Heart,
    admin: ClipboardList,
};

export function getAspectIcon(aspectKey: AspectKey): LucideIcon {
    return ASPECT_ICONS[aspectKey];
}

export function aspectBadgeClass(aspectKey: AspectKey): string {
    return `aspect-badge aspect-badge-${aspectKey}`;
}

export function getAspectBadgeLabel(aspectKey: AspectKey): string {
    return getAspectDefinition(aspectKey)?.shortLabel ?? aspectKey;
}
