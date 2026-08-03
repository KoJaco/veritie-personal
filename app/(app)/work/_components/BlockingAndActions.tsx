"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
    AlarmClock,
    Ban,
    ChevronDown,
    CircleOff,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNormalizedTaskImpact } from "@/lib/data-source/stub-normalized-stories";
import { ENABLE_SCOPE_COLORS } from "@/lib/lens/constants";
import {
    scopeBadgeClass,
    withLens,
    type ScopeKey,
    type ScopeLens,
} from "@/lib/lens";
import { getScopeLabel } from "@/lib/lens/scope-definitions";
import { type TaskStub } from "@/lib/stubs";
import { formatShortDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export function BlockingAndActions({
    blockingTasks,
    dueSoonTasks,
    quickWinTasks,
    now,
    lens,
}: {
    blockingTasks: TaskStub[];
    dueSoonTasks: TaskStub[];
    quickWinTasks: TaskStub[];
    now: Date;
    lens: ScopeLens;
}) {
    const hasAnyActions =
        blockingTasks.length > 0 ||
        dueSoonTasks.length > 0 ||
        quickWinTasks.length > 0;

    return (
        <section className="space-y-4">
            {!hasAnyActions ? (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Ban className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-base font-semibold capitalize">
                            Operational blockers and action groups
                        </h2>
                    </div>
                    <div className={`${SURFACE_CLASS} px-4 py-8 text-center`}>
                        <CircleOff className="mx-auto h-5 w-5 text-muted-foreground" />
                        <p className="mt-3 text-sm text-foreground/90">
                            No action groups need attention right now.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            You are clear on blockers and near-term due work.
                        </p>
                    </div>
                </div>
            ) : null}

            {hasAnyActions ? (
                <div className="space-y-8">
                    <ActionGroup
                        title="Blocking Operational"
                        icon={<Ban className="h-4 w-4 text-muted-foreground" />}
                        subtitle="Blocked, overdue, or missing required attachments."
                        emptyText="No blocking tasks right now."
                        tasks={blockingTasks}
                        now={now}
                        initialVisible={5}
                        loadStep={5}
                        lens={lens}
                    />

                    <ActionGroup
                        title="Due Soon"
                        icon={
                            <AlarmClock className="h-4 w-4 text-muted-foreground" />
                        }
                        subtitle="Due in the next 7 days, sorted by due date."
                        emptyText="No upcoming due tasks in the next 7 days."
                        tasks={dueSoonTasks}
                        now={now}
                        initialVisible={3}
                        loadStep={3}
                        lens={lens}
                    />

                    <ActionGroup
                        title="Quick Wins"
                        icon={
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                        }
                        subtitle="Low-complexity tasks with no visible blockers."
                        emptyText="No quick-win tasks identified right now."
                        tasks={quickWinTasks}
                        now={now}
                        initialVisible={3}
                        loadStep={3}
                        lens={lens}
                    />
                </div>
            ) : null}
        </section>
    );
}

function ActionGroup({
    title,
    icon,
    subtitle,
    emptyText,
    tasks,
    now,
    initialVisible,
    loadStep,
    lens,
}: {
    title: string;
    icon: ReactNode;
    subtitle: string;
    emptyText: string;
    tasks: TaskStub[];
    now: Date;
    initialVisible: number;
    loadStep: number;
    lens: ScopeLens;
}) {
    const [visibleCount, setVisibleCount] = useState(initialVisible);
    const visibleTasks = tasks.slice(0, visibleCount);
    const remaining = Math.max(0, tasks.length - visibleTasks.length);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="flex items-center gap-2 font-medium">
                    {icon}
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {tasks.length === 0 ? (
                <div className={`${SURFACE_CLASS} px-4 py-5`}>
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleTasks.map((task) => {
                        const scopeTag = getTaskScopeTag(task);
                        return (
                            <Link
                                key={task.id}
                                href={withLens(
                                    `/work/tasks/${task.id}`,
                                    lens,
                                )}
                                className={`block ${SURFACE_CLASS} p-4`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium">{task.title}</p>
                                    {scopeTag ? (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "shrink-0",
                                                ENABLE_SCOPE_COLORS &&
                                                    scopeBadgeClass(
                                                        scopeTag.key,
                                                    ),
                                            )}
                                        >
                                            {scopeTag.label}
                                        </Badge>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Required for{" "}
                                    {task.relatedObject?.title ??
                                        "check mapping pending"}
                                </p>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {buildTaskWhyItMatters(task, now)}
                                </p>
                            </Link>
                        );
                    })}

                    {remaining > 0 ? (
                        <Button
                            variant="link"
                            className="mt-2 px-0 -ml-2 text-primary hover:text-primary/75 hover:no-underline"
                            onClick={() =>
                                setVisibleCount((current) => current + loadStep)
                            }
                        >
                            View more ({remaining} remaining)
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function isOverdue(task: TaskStub, now: Date): boolean {
    if (!task.dueAt || task.status === "done") return false;
    return new Date(task.dueAt) < now;
}

function buildTaskWhyItMatters(task: TaskStub, now: Date): string {
    const reasons: string[] = [];
    const taskImpact = getNormalizedTaskImpact(task.id);

    const missingAttachmentCount = task.missingAttachmentCount;

    if (missingAttachmentCount > 0) {
        reasons.push(
            `Missing ${missingAttachmentCount} required attachment${missingAttachmentCount === 1 ? "" : "s"}`,
        );
    } else if (isOverdue(task, now) && task.dueAt) {
        reasons.push(`Overdue since ${formatShortDate(task.dueAt)}`);
    } else if (task.status === "blocked") {
        reasons.push("Task blocked and preventing check completion");
    }

    if (taskImpact) {
        reasons.push(taskImpact.impactSummary);
    }

    if (reasons.length === 0) {
        reasons.push("Supports the current operational work queue");
    }

    return `${reasons.join(". ")}.`;
}

function getTaskScopeTag(
    task: TaskStub,
): { key: ScopeKey; label: string } | null {
    const scopeId = task.scopeIds?.[0];
    if (!scopeId) return null;

    return { key: scopeId, label: getScopeLabel(scopeId) };
}
