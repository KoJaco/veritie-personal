"use client";

import { isSoc2TypeII, type ScopeLens } from "@/lib/lens";
import { cn } from "@/lib/utils";
import {
    DASHBOARD_COVERAGE_GAP_RISK_DAYS,
    DASHBOARD_COVERAGE_GAP_WARNING_MIN_DAYS,
} from "../_lib/constants";
import type { DashboardMetrics } from "../_page-model/composeVM";
import { Gauge } from "lucide-react";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export function OperationalStateOverview({
    metrics,
    narrative,
    lens,
}: {
    metrics: DashboardMetrics;
    narrative: string[];
    lens: ScopeLens;
}) {
    const showCoverageCard = isSoc2TypeII(lens);
    const coverageGapDays = metrics.coverageGapDays ?? 0;
    const coverageTone: "neutral" | "warning" | "risk" =
        coverageGapDays > DASHBOARD_COVERAGE_GAP_RISK_DAYS
            ? "risk"
            : coverageGapDays >= DASHBOARD_COVERAGE_GAP_WARNING_MIN_DAYS
              ? "warning"
              : "neutral";

    return (
        <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Gauge className="h-4 w-4 text-foreground" />
                Operational state overview
            </h2>

            <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-5">
                    <OverviewCard
                        label="Checks Complete"
                        value={`${metrics.checksComplete}/${metrics.checksTotal}`}
                    />
                    <OverviewCard
                        label="Blocked Checks"
                        value={String(metrics.blockedChecks)}
                        tone={metrics.blockedChecks > 0 ? "risk" : "neutral"}
                    />
                    <OverviewCard
                        label="Overdue Tasks"
                        value={String(metrics.overdueTasks)}
                        tone={metrics.overdueTasks > 0 ? "risk" : "neutral"}
                    />
                    <OverviewCard
                        label="Missing Attachments"
                        value={String(metrics.missingAttachments)}
                        tone={
                            metrics.missingAttachments > 0 ? "warning" : "neutral"
                        }
                    />
                    {showCoverageCard ? (
                        <OverviewCard
                            label="Coverage Gap (days)"
                            value={String(coverageGapDays)}
                            tone={coverageTone}
                        />
                    ) : (
                        <OverviewCard
                            label="Unmapped Checks"
                            value={String(metrics.unmappedChecks)}
                            tone={
                                metrics.unmappedChecks > 0
                                    ? "warning"
                                    : "neutral"
                            }
                        />
                    )}
                </div>

                <blockquote
                    className={`${SURFACE_CLASS} rounded-r-xl rounded-l-md border-l-0 border-l-primary p-3 md:px-4 md:py-4 relative`}
                >
                    <span className="absolute top-0 left-0 h-full w-1 bg-primary flex rounded-l-md" />

                    <div className="space-y-0.5">
                        {narrative.map((line, index) => (
                            <p
                                key={index}
                                className="text-sm leading-6 text-muted-foreground"
                            >
                                {line}
                            </p>
                        ))}
                    </div>
                </blockquote>
            </div>
        </section>
    );
}

function OverviewCard({
    label,
    value,
    tone = "neutral",
}: {
    label: string;
    value: string;
    tone?: "neutral" | "warning" | "risk";
}) {
    return (
        <div className={`${SURFACE_CLASS} p-4`}>
            <p
                className={cn(
                    "text-2xl font-semibold tracking-tight",
                    tone === "risk" && "text-red-700 dark:text-red-400",
                    tone === "warning" && "text-amber-700 dark:text-amber-400",
                )}
            >
                {value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
    );
}
