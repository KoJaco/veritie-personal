import {
    checkDetailHref,
    type CheckScope,
} from "@/lib/data-source/checks-read-model";
import { withLens, type ScopeLens } from "@/lib/lens";

export type DashboardEntityTarget =
    | { type: "task"; id: string }
    | { type: "object"; id: string }
    | { type: "attachment"; id: string }
    | { type: "resource"; id: string }
    | { type: "check"; id: string; scope: CheckScope };

export function buildDashboardEntityHref(
    target: DashboardEntityTarget,
    lens: ScopeLens,
): string {
    if (target.type === "task") {
        return withLens(`/work/tasks/${target.id}`, lens);
    }

    if (target.type === "object") {
        return withLens(`/work/documents/${target.id}`, lens);
    }

    if (target.type === "attachment") {
        return withLens(`/work/tasks`, lens);
    }

    if (target.type === "resource") {
        return withLens(`/work/resources/${target.id}`, lens);
    }

    return withLens(checkDetailHref(target.scope, target.id), lens);
}
