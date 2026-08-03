"use client";

import Link from "next/link";
import type { RailContextPayload } from "../types";

type TopBlockingSummary = {
    id?: string;
    title?: string;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}

function formatAsOf(asOf?: string, timezone?: string): string {
    if (!asOf) return "As of: unavailable";
    const date = new Date(asOf);
    const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `As of: ${date.toLocaleString("en-US", { timeZone: tz })} (${tz})`;
}

function getTopBlockingTaskSummaries(data?: Record<string, unknown>): TopBlockingSummary[] {
    const candidate = data?.topBlockingTaskSummaries;
    if (!Array.isArray(candidate)) return [];
    return candidate
        .map((item) => {
            const value = asRecord(item);
            return {
                id: asString(value?.id),
                title: asString(value?.title),
            };
        })
        .filter((item) => item.id || item.title)
        .slice(0, 5);
}

export function ContextTab({ context }: { context?: RailContextPayload }) {
    const data = asRecord(context?.data);
    const lens = asRecord(data?.lens);
    const snapshot = asRecord(data?.snapshot);

    const asOf = asString(data?.asOf);
    const timezone = asString(data?.timezone);
    const scopeMappingStatus = asString(snapshot?.criteriaSetStatus);

    const blockedChecks = asNumber(snapshot?.blockedChecks);
    const overdueTasks = asNumber(snapshot?.overdueTasks);
    const missingAttachments = asNumber(snapshot?.missingAttachments);
    const unmappedChecks = asNumber(snapshot?.unmappedChecks);
    const coverageGapDays = asNumber(snapshot?.coverageGapDays);
    const topBlockingTasks = getTopBlockingTaskSummaries(data);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 pb-4 pt-3 text-sm">
            <div className="space-y-1 text-muted-foreground">
                <p>{formatAsOf(asOf, timezone)}</p>
                <p>Scope: {asString(lens?.scope) ?? "all"}</p>
            </div>

            <div className="mt-4 space-y-1">
                <p>Blocked checks: {blockedChecks ?? 0}</p>
                <p>Overdue tasks: {overdueTasks ?? 0}</p>
                <p>Missing attachments: {missingAttachments ?? 0}</p>
                <p>Unmapped checks: {unmappedChecks ?? 0}</p>
                <p>Coverage gap days: {coverageGapDays ?? 0}</p>
            </div>

            <div className="mt-4">
                <p className="font-medium">Top blockers</p>
                {topBlockingTasks.length === 0 ? (
                    <p className="mt-1 text-muted-foreground">No blocking task summaries available.</p>
                ) : (
                    <ul className="mt-1 space-y-1">
                        {topBlockingTasks.map((task, idx) => {
                            const href = task.id ? `/work/tasks/${task.id}` : "/work/tasks";
                            const label = task.title ?? task.id ?? `Task ${idx + 1}`;
                            return (
                                <li key={`${task.id ?? "task"}-${idx}`}>
                                    <Link href={href} className="underline-offset-2 hover:underline">
                                        {label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="mt-4">
                <p className="font-medium">Hard stops</p>
                <p className="mt-1 text-muted-foreground">
                    Scope mapping status: {scopeMappingStatus ?? "unknown"}
                </p>
                {scopeMappingStatus === "invalid" ? (
                    <p className="text-red-700 dark:text-red-400">Fail-closed: configuration invalid</p>
                ) : null}
            </div>
        </div>
    );
}
