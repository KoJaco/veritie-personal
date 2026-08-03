import {
    getNormalizedDashboardActivities,
    getNormalizedDashboardTaskStubs,
    getNormalizedDashboardWorkstreams,
    getNormalizedAttachmentSeed,
    getStoryUser,
} from "@/lib/data-source/stub-normalized-stories";
import type {
    TaskFilters,
    TaskStub,
    WorkDashboardStub,
    WorkstreamStub,
} from "./types";

const DEMO_NOW = new Date("2026-04-07T00:00:00.000Z");

export function getWorkTasksStub(
    count = 10,
    filters?: TaskFilters,
): TaskStub[] {
    return getNormalizedDashboardTaskStubs(count, filters);
}

export function getWorkDashboardStub(): WorkDashboardStub {
    const tasks = getWorkTasksStub(32);
    const activeWorkstreams = buildWorkstreams(tasks);
    const recentActivity = getNormalizedDashboardActivities().map((activity) => ({
        id: activity.id,
        type: activity.type,
        actor: getStoryUser(activity.actorId),
        timestamp: activity.timestamp,
        target: { ...activity.target },
        summary: activity.summary,
    }));

    const attachmentIds = new Set(
        getNormalizedDashboardWorkstreams().map((workstream) => workstream.attachmentId),
    );
    const attachmentsAccepted = Array.from(attachmentIds).filter((attachmentId) => {
        const attachment = getNormalizedAttachmentSeed(attachmentId);
        return attachment?.status === "active";
    }).length;
    const attachmentsTotal = attachmentIds.size;
    const tasksCompleted = tasks.filter((task) => task.status === "done").length;
    const tasksTotal = tasks.length;
    const overallCompletion =
        tasksTotal + attachmentsTotal > 0
            ? Math.round(
                  ((tasksCompleted + attachmentsAccepted) /
                      (tasksTotal + attachmentsTotal)) *
                      100,
              )
            : 0;

    return {
        progressSummary: {
            overallCompletion,
            tasksCompleted,
            tasksTotal,
            attachmentsAccepted,
            attachmentsTotal,
        },
        overdueCount: tasks.filter((task) => isOverdue(task, DEMO_NOW)).length,
        blockedCount: tasks.filter((task) => task.status === "blocked").length,
        dueSoonCount: tasks.filter((task) => isDueSoon(task, DEMO_NOW)).length,
        nextActions: buildNextActions(tasks),
        activeWorkstreams,
        recentActivity,
    };
}

function buildNextActions(tasks: TaskStub[]): TaskStub[] {
    const seenIds = new Set<string>();

    return tasks
        .filter((task) => task.status !== "done")
        .filter((task) => {
            if (seenIds.has(task.id)) {
                return false;
            }

            seenIds.add(task.id);
            return true;
        })
        .sort((left, right) => {
            const priorityOrder = {
                critical: 0,
                high: 1,
                medium: 2,
                low: 3,
            } satisfies Record<TaskStub["priority"], number>;
            const priorityDelta =
                priorityOrder[left.priority] - priorityOrder[right.priority];

            if (priorityDelta !== 0) {
                return priorityDelta;
            }

            if (left.dueAt && right.dueAt) {
                return Date.parse(left.dueAt) - Date.parse(right.dueAt);
            }

            if (left.dueAt) {
                return -1;
            }

            if (right.dueAt) {
                return 1;
            }

            return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
        })
        .slice(0, 5);
}

function buildWorkstreams(tasks: TaskStub[]): WorkstreamStub[] {
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    return getNormalizedDashboardWorkstreams().map((workstream) => {
        const relatedTasks = workstream.taskIds
            .map((taskId) => tasksById.get(taskId))
            .filter((task): task is TaskStub => Boolean(task));
        const completedCount = relatedTasks.filter(
            (task) => task.status === "done",
        ).length;
        const progress =
            relatedTasks.length > 0
                ? Math.round((completedCount / relatedTasks.length) * 100)
                : 0;

        return {
            id: workstream.id,
            name: workstream.title,
            taskCount: relatedTasks.filter((task) => task.status !== "done").length,
            progress,
        };
    });
}

function isOverdue(task: TaskStub, now: Date): boolean {
    if (!task.dueAt || task.status === "done") {
        return false;
    }

    return Date.parse(task.dueAt) < now.getTime();
}

function isDueSoon(task: TaskStub, now: Date): boolean {
    if (!task.dueAt || task.status === "done") {
        return false;
    }

    const sevenDaysOut = new Date(now);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const dueAt = Date.parse(task.dueAt);

    return dueAt >= now.getTime() && dueAt <= sevenDaysOut.getTime();
}
