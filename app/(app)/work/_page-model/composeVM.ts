// Dashboard route domain/view projection.
import { isSoc2TypeII, withLens, type ScopeLens } from "@/lib/lens";
import { getScopeLabel } from "@/lib/lens/scope-definitions";
import { scopeIdsMatchLens } from "@/lib/lens/scope-matching";
import {
    getNormalizedDashboardWorkstreams,
    getNormalizedTargetScopeIds,
    getNormalizedTaskImpact,
} from "@/lib/data-source/stub-normalized-stories";
import {
    getScopeMappingStatusStub,
    type ActivityStub,
    type TaskStub,
    type TaskSummaryStub,
} from "@/lib/stubs";
import {
    DASHBOARD_BLOCKED_CHECK_GAP_WEIGHT,
    DASHBOARD_OVERDUE_TASK_GAP_WEIGHT,
    DASHBOARD_PRIORITY_WEIGHT,
} from "../_lib/constants";

export type CheckAggregate = {
    id: string;
    title: string;
    domain: string;
    totalTasks: number;
    completedTasks: number;
    openTasks: number;
    missingAttachmentCount: number;
    blocked: boolean;
};

export type DashboardMetrics = {
    tasksTotal: number;
    tasksInScope: number;
    checksComplete: number;
    checksTotal: number;
    blockedChecks: number;
    overdueTasks: number;
    missingAttachments: number;
    unmappedChecks: number;
    criteriaSetStatus?: "valid" | "invalid";
    windowStatus?: "valid" | "invalid";
    coverageGapDays?: number;
    completionPercent: number;
};

export type DashboardWorkstream = {
    id: string;
    title: string;
    summary: string;
    statusNote: string;
    openTaskCount: number;
    missingAttachmentCount: number;
    progress: number;
    taskHref: string;
};

export type DashboardRailSnapshot = {
    tasksTotal: number;
    tasksInScope: number;
    blockedChecks: number;
    overdueTasks: number;
    missingAttachments: number;
    unmappedChecks: number;
    criteriaSetStatus?: "valid" | "invalid";
    windowStatus?: "valid" | "invalid";
    coverageGapDays?: number;
};

export type DashboardModel = {
    lens: ScopeLens;
    now: Date;
    tasks: TaskStub[];
    checkAggregates: CheckAggregate[];
    metrics: DashboardMetrics;
    blockingTasks: TaskStub[];
    blockingTaskSummaries: TaskSummaryStub[];
    dueSoonTasks: TaskStub[];
    quickWinTasks: TaskStub[];
    workstreams: DashboardWorkstream[];
    activitySignals: ActivityStub[];
    narrative: string[];
    scopesInView: string[];
    railSnapshot: DashboardRailSnapshot;
};

export type BuildDashboardViewModelParams = {
    lens: ScopeLens;
    now: Date;
    allTasks: TaskStub[];
    activitySignals: ActivityStub[];
    buildTaskSummaries: (tasks: TaskStub[], now: Date) => TaskSummaryStub[];
};

export function buildDashboardViewModel({
    lens,
    now,
    allTasks,
    activitySignals,
    buildTaskSummaries,
}: BuildDashboardViewModelParams): DashboardModel {
    const tasks = filterTasksByLens(allTasks, lens);
    const checkAggregates = buildCheckAggregates(tasks, now);
    const metrics = buildDashboardMetrics(
        checkAggregates,
        allTasks,
        tasks,
        now,
        lens,
    );
    const blockingTasks = getBlockingTasks(tasks, now);
    const blockingTaskSummaries = buildTaskSummaries(blockingTasks, now);
    const dueSoonTasks = getDueSoonTasks(tasks, now);
    const quickWinTasks = getQuickWinTasks(tasks, now);
    const workstreams = buildStoryWorkstreams(tasks, lens, checkAggregates);
    const narrative = buildNarrative(
        metrics,
        blockingTasks,
        checkAggregates,
        lens,
    );
    const scopesInView = getScopesInView(allTasks);

    return {
        lens,
        now,
        tasks,
        checkAggregates,
        metrics,
        blockingTasks,
        blockingTaskSummaries,
        dueSoonTasks,
        quickWinTasks,
        workstreams,
        activitySignals: filterActivitySignalsByLens(activitySignals, lens).slice(
            0,
            10,
        ),
        narrative,
        scopesInView,
        railSnapshot: {
            tasksTotal: metrics.tasksTotal,
            tasksInScope: metrics.tasksInScope,
            blockedChecks: metrics.blockedChecks,
            overdueTasks: metrics.overdueTasks,
            missingAttachments: metrics.missingAttachments,
            unmappedChecks: metrics.unmappedChecks,
            criteriaSetStatus: metrics.criteriaSetStatus,
            windowStatus: metrics.windowStatus,
            coverageGapDays: metrics.coverageGapDays,
        },
    };
}

function buildDashboardMetrics(
    checks: CheckAggregate[],
    allTasks: TaskStub[],
    tasks: TaskStub[],
    now: Date,
    lens: ScopeLens,
): DashboardMetrics {
    const tasksTotal = allTasks.length;
    const tasksInScope = tasks.length;
    const checksComplete = checks.filter((check) =>
        isCheckComplete(check),
    ).length;
    const checksTotal = checks.length;
    const blockedChecks = checks.filter(
        (check) => check.blocked,
    ).length;
    const overdueTasks = tasks.filter((task) => isOverdue(task, now)).length;
    const missingAttachments = tasks.reduce(
        (sum, task) => sum + task.missingAttachmentCount,
        0,
    );
    const unmappedChecks = getUnmappedCheckCount(tasks);
    const completionPercent =
        checksTotal > 0
            ? Math.round((checksComplete / checksTotal) * 100)
            : 0;
    const criteriaSetStatus = getCriteriaSetStatus(lens);
    const windowStatus = getWindowStatus(lens);
    const coverageGapDays = getCoverageGapDays(
        lens,
        blockedChecks,
        overdueTasks,
    );

    return {
        tasksTotal,
        tasksInScope,
        checksComplete,
        checksTotal,
        blockedChecks,
        overdueTasks,
        missingAttachments,
        unmappedChecks,
        criteriaSetStatus,
        windowStatus,
        coverageGapDays,
        completionPercent,
    };
}

// !placeholder, I'm assuming this will be replaced with a backend-driven narrative, could be generated based on current state, or could be derived from data received from the backend.
function buildNarrative(
    metrics: DashboardMetrics,
    blockingTasks: TaskStub[],
    checks: CheckAggregate[],
    lens: ScopeLens,
): string[] {
    if (metrics.windowStatus === "invalid") {
        return [
            "The selected coverage window is incomplete; timeline analysis cannot run yet.",
            "Select a valid custom window with both start and end dates to restore coverage analysis.",
            "Immediate recommendation: update the window selection and review open checks.",
        ];
    }

    if (metrics.criteriaSetStatus === "invalid") {
        return [
            "Scope mapping is invalid; readiness interpretation is fail-closed.",
            "Resolve scope mapping validation issues in Settings before interpreting readiness status.",
            "Immediate recommendation: open Settings and fix scope mapping to re-enable reliable guidance.",
        ];
    }

    const topBlockedCheck = checks
        .filter((check) => check.blocked)
        .sort((a, b) => b.openTasks - a.openTasks)[0];

    const topTask = blockingTasks[0];
    const taskImpact = topTask ? getNormalizedTaskImpact(topTask.id) : undefined;
    const unlockCount = taskImpact?.dependentCheckCount ?? 0;

    const line1 = isSoc2TypeII(lens)
        ? `Coverage window (${formatLensWindow(lens)}) shows ${metrics.checksComplete}/${metrics.checksTotal} checks complete.`
        : `You are ${metrics.checksComplete}/${metrics.checksTotal} across checks in scope.`;

    const line2 = isSoc2TypeII(lens)
        ? `Coverage gap is ${metrics.coverageGapDays ?? 0} day${(metrics.coverageGapDays ?? 0) === 1 ? "" : "s"} in the selected window.`
        : topBlockedCheck
          ? `${topBlockedCheck.title} is currently blocked with ${topBlockedCheck.openTasks} open task ${topBlockedCheck.openTasks === 1 ? "" : "s"}.`
          : "No checks are currently blocked.";

    const line3 = topTask
        ? taskImpact
            ? `Immediate recommendation: complete "${topTask.title}" to advance ${unlockCount} dependent check${unlockCount === 1 ? "" : "s"}.`
            : `Immediate recommendation: complete "${topTask.title}" to reduce near-term operational risk.`
        : "Immediate recommendation: continue closing due-soon tasks to reduce near-term operational risk.";

    return [line1, line2, line3];
}

function buildCheckAggregates(
    tasks: TaskStub[],
    now: Date,
): CheckAggregate[] {
    const grouped = new Map<string, TaskStub[]>();

    for (const task of tasks) {
        if (!task.relatedObject) continue;
        const key = task.relatedObject.id;
        const current = grouped.get(key) ?? [];
        current.push(task);
        grouped.set(key, current);
    }

    return Array.from(grouped.entries()).map(([id, relatedTasks]) => {
        const base = relatedTasks[0]?.relatedObject;
        const completedTasks = relatedTasks.filter(
            (task) => task.status === "done",
        ).length;
        const openTasks = relatedTasks.length - completedTasks;
        const missingAttachmentCount = relatedTasks.reduce(
            (sum, task) => sum + task.missingAttachmentCount,
            0,
        );

        const blocked = isCheckBlocked(relatedTasks, now);

        return {
            id,
            title: base?.title ?? "Unmapped Check",
            domain: toDomain(base?.title),
            totalTasks: relatedTasks.length,
            completedTasks,
            openTasks,
            missingAttachmentCount,
            blocked,
        };
    });
}

function buildStoryWorkstreams(
    tasks: TaskStub[],
    lens: ScopeLens,
    checks: CheckAggregate[],
): DashboardWorkstream[] {
    const tasksById = new Map(tasks.map((task) => [task.id, task]));
    const canonicalWorkstreams: DashboardWorkstream[] =
        getNormalizedDashboardWorkstreams()
        .filter((workstream) =>
            scopeIdsMatchLens(workstream.scopeIds, lens),
        )
        .map((workstream) => {
            const relatedTasks = workstream.taskIds
                .map((taskId) => tasksById.get(taskId))
                .filter((task): task is TaskStub => Boolean(task));

            if (relatedTasks.length === 0) {
                return null;
            }

            const completedCount = relatedTasks.filter(
                (task) => task.status === "done",
            ).length;
            const openTaskCount = relatedTasks.length - completedCount;
            const missingAttachmentCount = relatedTasks.reduce(
                (sum, task) => sum + task.missingAttachmentCount,
                0,
            );
            const progress = Math.round(
                (completedCount / relatedTasks.length) * 100,
            );

            return {
                id: workstream.id,
                title: workstream.title,
                summary: workstream.summary,
                statusNote: workstream.statusNote,
                openTaskCount,
                missingAttachmentCount,
                progress,
                taskHref: buildWorkstreamTaskHref(
                    lens,
                    relatedTasks
                        .map((task) => task.relatedObject?.id)
                        .filter((controlId): controlId is string =>
                            Boolean(controlId),
                        ),
                ),
            };
        })
        .filter((workstream) => workstream !== null);

    if (canonicalWorkstreams.length > 0) {
        return canonicalWorkstreams.sort(
            (left, right) => right.openTaskCount - left.openTaskCount,
        );
    }

    const byDomain = new Map<string, CheckAggregate[]>();

    for (const check of checks) {
        const current = byDomain.get(check.domain) ?? [];
        current.push(check);
        byDomain.set(check.domain, current);
    }

    return Array.from(byDomain.entries())
        .map(([domain, domainChecks]) => {
            const checksTotal = domainChecks.length;
            const checksComplete = domainChecks.filter((check) =>
                isCheckComplete(check),
            ).length;
            const openTaskCount = domainChecks.reduce(
                (sum, check) => sum + check.openTasks,
                0,
            );
            const missingAttachmentCount = domainChecks.reduce(
                (sum, check) => sum + check.missingAttachmentCount,
                0,
            );
            const progress =
                checksTotal > 0
                    ? Math.round((checksComplete / checksTotal) * 100)
                    : 0;

            return {
                id: domain.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                title: domain,
                summary: "Derived from the current in-scope task group.",
                statusNote: `${openTaskCount} open task${openTaskCount === 1 ? "" : "s"} across ${checksTotal} mapped check${checksTotal === 1 ? "" : "s"}.`,
                openTaskCount,
                missingAttachmentCount,
                progress,
                taskHref: buildWorkstreamTaskHref(
                    lens,
                    domainChecks.map((check) => check.id),
                ),
            };
        })
        .sort((a, b) => b.openTaskCount - a.openTaskCount)
        .slice(0, 6);
}

function buildWorkstreamTaskHref(
    lens: ScopeLens,
    checkIds: string[],
): string {
    const uniqueCheckIds = Array.from(new Set(checkIds));

    return withLens("/work/tasks", lens, {
        check: uniqueCheckIds.length > 0 ? uniqueCheckIds : null,
        page: null,
    });
}

function getBlockingTasks(tasks: TaskStub[], now: Date): TaskStub[] {
    return [...tasks]
        .filter((task) => isTaskBlocking(task, now))
        .sort((a, b) => {
            const prio =
                DASHBOARD_PRIORITY_WEIGHT[a.priority] -
                DASHBOARD_PRIORITY_WEIGHT[b.priority];
            if (prio !== 0) return prio;
            if (a.dueAt && b.dueAt) {
                return (
                    new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
                );
            }
            if (a.dueAt) return -1;
            if (b.dueAt) return 1;
            return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            );
        });
}

function getDueSoonTasks(tasks: TaskStub[], now: Date): TaskStub[] {
    const sevenDaysOut = new Date(now);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

    return [...tasks]
        .filter((task) => {
            if (task.status === "done" || !task.dueAt) return false;
            const due = new Date(task.dueAt);
            return due >= now && due <= sevenDaysOut;
        })
        .sort(
            (a, b) =>
                new Date(a.dueAt as string).getTime() -
                new Date(b.dueAt as string).getTime(),
        );
}

function getQuickWinTasks(tasks: TaskStub[], now: Date): TaskStub[] {
    return tasks
        .filter((task) => {
            if (task.status === "done" || task.status === "blocked")
                return false;
            if (task.missingAttachmentCount > 0) return false;
            if (isOverdue(task, now)) return false;
            return task.priority === "low" || task.priority === "medium";
        })
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        );
}

function isOverdue(task: TaskStub, now: Date): boolean {
    if (!task.dueAt || task.status === "done") return false;
    return new Date(task.dueAt) < now;
}

function isTaskBlocking(task: TaskStub, now: Date): boolean {
    return (
        task.status === "blocked" ||
        isOverdue(task, now) ||
        task.missingAttachmentCount > 0
    );
}

function isCheckComplete(check: CheckAggregate): boolean {
    const allRequiredTasksComplete = check.openTasks === 0;
    const requiredAttachmentsPresent = check.missingAttachmentCount === 0;
    const objectStatusApproved = true;
    return (
        allRequiredTasksComplete &&
        requiredAttachmentsPresent &&
        objectStatusApproved
    );
}

function isCheckBlocked(tasks: TaskStub[], now: Date): boolean {
    const hasIncompleteTasks = tasks.some((task) => task.status !== "done");
    const hasBlockingCondition = tasks.some((task) =>
        isTaskBlocking(task, now),
    );
    return hasIncompleteTasks && hasBlockingCondition;
}

function toDomain(title?: string): string {
    if (!title) return "Operations";
    const value = title.toLowerCase();
    if (
        value.includes("access") ||
        value.includes("identity") ||
        value.includes("mfa")
    ) {
        return "Access Control";
    }
    if (value.includes("vendor") || value.includes("third-party")) {
        return "Vendor Risk";
    }
    if (
        value.includes("log") ||
        value.includes("monitor") ||
        value.includes("incident")
    ) {
        return "Logging and Response";
    }
    if (
        value.includes("backup") ||
        value.includes("continuity") ||
        value.includes("recovery")
    ) {
        return "Resilience";
    }
    return "Security Operations";
}

function filterActivitySignalsByLens(
    activitySignals: ActivityStub[],
    lens: ScopeLens,
): ActivityStub[] {
    return activitySignals.filter((signal) => {
        const scopeIds = getNormalizedTargetScopeIds(signal.target);

        if (scopeIds.length === 0) {
            return lens.scope === "all";
        }

        return scopeIdsMatchLens(scopeIds, lens);
    });
}

function getScopesInView(tasks: TaskStub[]): string[] {
    const labels = new Set<string>();

    for (const task of tasks) {
        for (const scopeId of task.scopeIds ?? []) {
            labels.add(getScopeLabel(scopeId));
        }
    }

    return Array.from(labels);
}

function filterTasksByLens(tasks: TaskStub[], lens: ScopeLens): TaskStub[] {
    return tasks.filter((task) => taskMatchesLens(task, lens));
}

function taskMatchesLens(task: TaskStub, lens: ScopeLens): boolean {
    return scopeIdsMatchLens(task.scopeIds, lens);
}

function getUnmappedCheckCount(tasks: TaskStub[]): number {
    return tasks.filter((task) => !task.relatedObject && task.status !== "done")
        .length;
}

function getCriteriaSetStatus(
    lens: ScopeLens,
): "valid" | "invalid" | undefined {
    if (
        lens.scope !== "operations-readiness" &&
        lens.scope !== "delivery-observability"
    ) {
        return undefined;
    }
    return getScopeMappingStatusStub();
}

function getWindowStatus(lens: ScopeLens): "valid" | "invalid" | undefined {
    if (!isSoc2TypeII(lens)) return undefined;
    return "valid";
}

function getCoverageGapDays(
    lens: ScopeLens,
    blockedChecks: number,
    overdueTasks: number,
): number | undefined {
    if (!isSoc2TypeII(lens)) return undefined;

    const windowBase = 90;
    return Math.min(
        windowBase,
        blockedChecks * DASHBOARD_BLOCKED_CHECK_GAP_WEIGHT +
            overdueTasks * DASHBOARD_OVERDUE_TASK_GAP_WEIGHT,
    );
}

function formatLensWindow(lens: ScopeLens): string {
    if (!isSoc2TypeII(lens)) return "n/a";
    return "90d";
}
