import type { ScopeKey } from "@/lib/lens/types";

export function scopeBadgeClass(key: ScopeKey): string {
    switch (key) {
        case "operations-readiness":
            return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
        case "delivery-observability":
            return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
        case "workspace-resilience":
            return "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300";
        case "knowledge-hygiene":
            return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
    }
}
