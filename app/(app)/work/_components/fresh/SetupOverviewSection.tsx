"use client";

import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import type { FreshDashboardOverview } from "@/lib/onboarding-stub";

export function SetupOverviewSection({
    overview,
}: {
    overview: FreshDashboardOverview;
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    {overview.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {overview.description}
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {overview.metrics.map((metric) => (
                    <div key={metric.id} className={cn(SURFACE_CLASS, "p-4")}>
                        <p
                            className={cn(
                                "text-2xl font-semibold tracking-tight",
                                metric.tone === "risk" &&
                                    "text-red-700 dark:text-red-400",
                                metric.tone === "warning" &&
                                    "text-amber-700 dark:text-amber-400",
                            )}
                        >
                            {metric.value}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {metric.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
