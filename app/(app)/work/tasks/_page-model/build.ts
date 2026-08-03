import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type {
    TaskDetailReadModel,
    TasksIndexReadModel,
} from "@/lib/data-source";
import type { ScopeLens } from "@/lib/lens";
import {
    buildFreshDashboardModel,
    type StubBootstrapSummary,
} from "@/lib/onboarding-stub";
import type { PageModel } from "@/lib/page-model/types";

export type TasksRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

type BuildTasksRouteContractParams =
    | {
          scope: "tasks_index";
          lens: ScopeLens;
          tasksIndex: TasksIndexReadModel;
      }
    | {
          scope: "task_detail";
          lens: ScopeLens;
          taskDetail: TaskDetailReadModel;
      };

export function buildTasksIndexPageModel({
    lens,
    tasksIndex,
}: {
    lens: ScopeLens;
    tasksIndex: TasksIndexReadModel;
}): PageModel {
    return {
        meta: {
            title: "Tasks",
            description: "Your operational work, prioritised.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Tasks" },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "tasks_index",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            visible: tasksIndex.items.slice(0, 12).map((task) => ({
                kind: "task",
                id: task.id,
                title: task.title,
                summary: task.status,
                href: `/work/tasks/${task.id}`,
            })),
        },
        sections: [
            {
                key: "tasks_summary",
                title: "Task summary",
                kind: "metrics_grid",
                items: [
                    {
                        kind: "metric",
                        id: "open_tasks",
                        summary: String(tasksIndex.summary.open),
                    },
                    {
                        kind: "metric",
                        id: "due_soon_tasks",
                        summary: String(tasksIndex.summary.dueSoon),
                    },
                    {
                        kind: "metric",
                        id: "overdue_tasks",
                        summary: String(tasksIndex.summary.overdue),
                    },
                    {
                        kind: "metric",
                        id: "completed_tasks",
                        summary: String(tasksIndex.summary.completed),
                    },
                ],
            },
            {
                key: "task_queue",
                title: "Task queue",
                kind: "task_list",
                items: tasksIndex.items.slice(0, 12).map((task) => ({
                    kind: "task",
                    id: task.id,
                    summary: task.title,
                })),
            },
        ],
        capabilities: {
            canCreateTask: true,
            canUploadAttachment: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: [
                "tasks/createTask",
                "tasks/openTask",
                "attachments/upload",
                "work/openScopeDialog",
                "context/toggleRail",
            ],
        },
    };
}

export function buildFreshTasksIndexPageModel({
    lens,
    tasksIndex,
}: {
    lens: ScopeLens;
    tasksIndex: TasksIndexReadModel;
}): PageModel {
    return {
        meta: {
            title: "Tasks",
            description: "Your setup work, prioritised.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Tasks" },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "tasks_index",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
                onboardingMode: true,
            },
        },
        refs: {
            visible: tasksIndex.items.slice(0, 12).map((task) => ({
                kind: "task",
                id: task.id,
                title: task.title,
                summary: task.status,
                href: `/work/tasks/${task.id}`,
            })),
        },
        sections: [
            {
                key: "setup_summary",
                title: "Setup summary",
                kind: "metrics_grid",
                items: [
                    {
                        kind: "metric",
                        id: "open_setup_tasks",
                        summary: String(tasksIndex.summary.open),
                    },
                    {
                        kind: "metric",
                        id: "blocked_setup_tasks",
                        summary: String(tasksIndex.summary.blocked),
                    },
                    {
                        kind: "metric",
                        id: "completed_setup_tasks",
                        summary: String(tasksIndex.summary.completed),
                    },
                ],
            },
            {
                key: "setup_queue",
                title: "Setup queue",
                kind: "task_list",
                items: tasksIndex.items.slice(0, 12).map((task) => ({
                    kind: "task",
                    id: task.id,
                    summary: task.title,
                })),
            },
        ],
        capabilities: {
            canCreateTask: true,
            canUploadAttachment: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: [
                "tasks/createTask",
                "tasks/openTask",
                "attachments/upload",
                "work/openScopeDialog",
                "context/toggleRail",
            ],
        },
    };
}

export function buildTaskDetailPageModel({
    lens,
    taskDetail,
}: {
    lens: ScopeLens;
    taskDetail: TaskDetailReadModel;
}): PageModel {
    return {
        meta: {
            title: taskDetail.title,
            description: "Task execution surface with attachment-first workflow.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Tasks", href: "/work/tasks" },
                { label: taskDetail.title },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "task_detail",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            primary: {
                kind: "task",
                id: taskDetail.id,
                title: taskDetail.title,
                summary: taskDetail.status,
                href: `/work/tasks/${taskDetail.id}`,
            },
            visible: [
                {
                    kind: "check",
                    id: taskDetail.check.id,
                    title: taskDetail.check.title,
                },
                ...taskDetail.attachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    title: item.title,
                    summary: `v${item.currentVersionNumber}`,
                    href: `/work/documents/${item.id}`,
                })),
                ...taskDetail.documents.map((document) => ({
                    kind: "document",
                    id: document.id,
                    title: document.title,
                    href: document.href,
                })),
            ],
        },
        sections: [
            {
                key: "task_overview",
                title: "Task overview",
                kind: "task_overview",
                dataRef: {
                    kind: "task",
                    id: taskDetail.id,
                },
            },
            {
                key: "task_attachments",
                title: "Attachments",
                kind: "attachments_list",
                items: taskDetail.attachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    summary: item.title,
                })),
            },
            {
                key: "task_documents",
                title: "Documents",
                kind: "documents_list",
                items: taskDetail.documents.map((document) => ({
                    kind: "document",
                    id: document.id,
                    summary: document.title,
                })),
            },
            {
                key: "task_activity",
                title: "Activity",
                kind: "activity_list",
                items: taskDetail.activity.map((item) => ({
                    kind: "activity",
                    id: item.id,
                    summary: item.summary,
                })),
            },
        ],
        capabilities: {
            canMarkTaskComplete: true,
            canUploadAttachment: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: [
                "tasks/markComplete",
                "attachments/upload",
                "work/openScopeDialog",
                "context/toggleRail",
            ],
        },
    };
}

export function buildFreshTaskDetailPageModel({
    lens,
    taskDetail,
}: {
    lens: ScopeLens;
    taskDetail: TaskDetailReadModel;
}): PageModel {
    return {
        meta: {
            title: taskDetail.title,
            description:
                "Setup task execution surface with onboarding-first workflow.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Tasks", href: "/work/tasks" },
                { label: taskDetail.title },
            ],
            scope: { scopeId: lens.scope },
        },
        view: {
            key: "task_detail",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
                onboardingMode: true,
            },
        },
        refs: {
            primary: {
                kind: "task",
                id: taskDetail.id,
                title: taskDetail.title,
                summary: taskDetail.status,
                href: `/work/tasks/${taskDetail.id}`,
            },
            visible: [
                {
                    kind: "check",
                    id: taskDetail.check.id,
                    title: taskDetail.check.title,
                },
                ...taskDetail.attachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    title: item.title,
                    summary: `v${item.currentVersionNumber}`,
                    href: `/work/documents/${item.id}`,
                })),
                ...taskDetail.documents.map((document) => ({
                    kind: "document",
                    id: document.id,
                    title: document.title,
                    href: document.href,
                })),
            ],
        },
        sections: [
            {
                key: "task_setup_overview",
                title: "Task overview",
                kind: "task_overview",
                dataRef: {
                    kind: "task",
                    id: taskDetail.id,
                },
            },
            {
                key: "task_setup_attachments",
                title: "Attachments",
                kind: "attachments_list",
                items: taskDetail.attachments.map((item) => ({
                    kind: "attachment",
                    id: item.id,
                    summary: item.title,
                })),
            },
            {
                key: "task_setup_documents",
                title: "Documents",
                kind: "documents_list",
                items: taskDetail.documents.map((document) => ({
                    kind: "document",
                    id: document.id,
                    summary: document.title,
                })),
            },
            {
                key: "task_setup_activity",
                title: "Activity",
                kind: "activity_list",
                items: taskDetail.activity.map((item) => ({
                    kind: "activity",
                    id: item.id,
                    summary: item.summary,
                })),
            },
        ],
        capabilities: {
            canMarkTaskComplete: true,
            canUploadAttachment: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: [
                "tasks/markComplete",
                "attachments/upload",
                "work/openScopeDialog",
                "context/toggleRail",
            ],
        },
    };
}

export function buildFreshTasksRouteContract(
    params:
        | {
              scope: "tasks_index";
              lens: ScopeLens;
              tasksIndex: TasksIndexReadModel;
              summary: StubBootstrapSummary | null;
          }
        | {
              scope: "task_detail";
              lens: ScopeLens;
              taskDetail: TaskDetailReadModel;
              summary: StubBootstrapSummary | null;
          },
): TasksRouteContract {
    if (params.scope === "tasks_index") {
        return {
            pageModel: buildFreshTasksIndexPageModel({
                lens: params.lens,
                tasksIndex: params.tasksIndex,
            }),
            railPayloadCandidate: buildRailPayload({
                scope: { type: "task_index" },
                lens: params.lens,
                aggregates: {
                    snapshot: {
                        blockedChecks: params.tasksIndex.summary.blocked,
                        overdueTasks: params.tasksIndex.summary.overdue,
                        missingAttachments: params.tasksIndex.items.reduce(
                            (total, task) => total + task.missingAttachmentCount,
                            0,
                        ),
                        tasksInScope: params.tasksIndex.items.length,
                        unmappedChecks: 0,
                    },
                    scopesInView: buildFreshDashboardModel(
                        params.summary,
                        params.lens,
                    ).setupAreas.map((area) => area.title),
                },
            }),
        };
    }

    return {
        pageModel: buildFreshTaskDetailPageModel({
            lens: params.lens,
            taskDetail: params.taskDetail,
        }),
        railPayloadCandidate: buildRailPayload({
            scope: { type: "task_detail", id: params.taskDetail.id },
            primaryObject: { type: "task", id: params.taskDetail.id },
            lens: params.lens,
            aggregates: {
                snapshot: {
                    blockedChecks:
                        params.taskDetail.status === "blocked" ? 1 : 0,
                    overdueTasks: params.taskDetail.isOverdue ? 1 : 0,
                    missingAttachments: params.taskDetail.missingAttachmentCount,
                    tasksInScope: 1,
                    unmappedChecks: 0,
                },
                scopesInView: buildFreshDashboardModel(
                    params.summary,
                    params.lens,
                ).setupAreas.map((area) => area.title),
            },
        }),
    };
}

export function buildTasksRouteContract(
    params: BuildTasksRouteContractParams,
): TasksRouteContract {
    if (params.scope === "tasks_index") {
        return {
            pageModel: buildTasksIndexPageModel({
                lens: params.lens,
                tasksIndex: params.tasksIndex,
            }),
            railPayloadCandidate: buildRailPayload({
                scope: { type: "task_index" },
                lens: params.lens,
                aggregates: {
                    snapshot: {
                        blockedChecks: 0,
                        overdueTasks: params.tasksIndex.summary.overdue,
                        missingAttachments: params.tasksIndex.items.reduce(
                            (total, task) => total + task.missingAttachmentCount,
                            0,
                        ),
                        tasksInScope: params.tasksIndex.items.length,
                        unmappedChecks: 0,
                    },
                },
            }),
        };
    }

    return {
        pageModel: buildTaskDetailPageModel({
            lens: params.lens,
            taskDetail: params.taskDetail,
        }),
        railPayloadCandidate: buildRailPayload({
            scope: { type: "task_detail", id: params.taskDetail.id },
            primaryObject: { type: "task", id: params.taskDetail.id },
            lens: params.lens,
            aggregates: {
                snapshot: {
                    blockedChecks:
                        params.taskDetail.status === "blocked" ? 1 : 0,
                    overdueTasks: params.taskDetail.isOverdue ? 1 : 0,
                    missingAttachments: params.taskDetail.missingAttachmentCount,
                    tasksInScope: 1,
                    unmappedChecks: 0,
                },
            },
        }),
    };
}
