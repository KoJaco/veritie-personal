import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { ScopeLens } from "@/lib/lens";
import {
    buildFreshDashboardModel,
    type FreshDashboardModel,
    type StubBootstrapSummary,
} from "@/lib/onboarding-stub";
import type { PageModel } from "@/lib/page-model/types";
import type { TaskSummaryStub } from "@/lib/stubs";
import {
    buildDashboardViewModel,
    type DashboardMetrics,
    type DashboardModel,
} from "./composeVM";

type BuildWorkOverviewPageModelParams = {
    lens: ScopeLens;
    metrics: DashboardMetrics;
    blockingTaskSummaries: TaskSummaryStub[];
    scopesInView: string[];
};

export type WorkRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

type BuildWorkRouteContractParams = {
    lens: ScopeLens;
    now: Date;
    model: DashboardModel;
};

// Dashboard-specific adapter into the global PageModel contract.
export function buildWorkOverviewPageModel({
    lens,
    metrics,
    blockingTaskSummaries,
    scopesInView,
}: BuildWorkOverviewPageModelParams): PageModel {
    return {
        meta: {
            title: "Work",
            description: "Dashboard operational readiness overview.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Work" },
            ],
            scope: {
                scopeId: lens.scope,
            },
        },
        view: {
            key: "work_overview",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
            },
        },
        refs: {
            visible: scopesInView.map((scope, index) => ({
                kind: "scope",
                id: `${scope.toLowerCase().replace(/\s+/g, "_")}_${index}`,
                title: scope,
            })),
        },
        sections: [
            {
                key: "operational_state_overview",
                title: "Operational state",
                kind: "dashboard_metrics",
                items: [
                    {
                        kind: "metric",
                        id: "blocked_checks",
                        summary: String(metrics.blockedChecks),
                    },
                    {
                        kind: "metric",
                        id: "overdue_tasks",
                        summary: String(metrics.overdueTasks),
                    },
                    {
                        kind: "metric",
                        id: "missing_attachments",
                        summary: String(metrics.missingAttachments),
                    },
                ],
            },
            {
                key: "blocking_actions",
                title: "Blocking actions",
                kind: "task_list",
                items: blockingTaskSummaries.slice(0, 5).map((taskSummary) => ({
                    kind: "task",
                    id: taskSummary.id,
                    summary: taskSummary.title,
                })),
            },
        ],
        capabilities: {
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: ["work/openScopeDialog", "context/toggleRail"],
        },
    };
}

export function buildFreshWorkOverviewPageModel({
    lens,
    summary,
    model,
}: {
    lens: ScopeLens;
    summary: StubBootstrapSummary | null;
    model: FreshDashboardModel;
}): PageModel {
    return {
        meta: {
            title: "Work",
            description:
                "Setup-first onboarding dashboard for a fresh workspace.",
            breadcrumbs: [
                { label: "Work", href: "/work" },
                { label: "Work" },
            ],
            scope: {
                scopeId: lens.scope,
            },
        },
        view: {
            key: "dashboard_setup_overview",
            featureFlags: {
                hasScopeFilter: lens.scope !== "all",
                onboardingMode: true,
            },
        },
        refs: {
            visible: model.setupAreas.map((area) => ({
                kind: "setup_area",
                id: area.id,
                title: area.title,
            })),
        },
        sections: [
            {
                key: "first_actions",
                title: "First actions",
                kind: "task_list",
                items: model.firstActions.map((action) => ({
                    kind: "task",
                    id: action.id,
                    summary: action.title,
                })),
            },
            {
                key: "setup_blockers",
                title: "Setup blockers",
                kind: "task_list",
                items: model.setupBlockers.map((blocker) => ({
                    kind: "setup_blocker",
                    id: blocker.id,
                    summary: blocker.title,
                })),
            },
            {
                key: "setup_overview",
                title: "Setup overview",
                kind: "metrics_grid",
                items: model.overview.metrics.map((metric) => ({
                    kind: "metric",
                    id: metric.id,
                    summary: String(metric.value),
                })),
            },
            {
                key: "setup_areas",
                title: "Setup areas",
                kind: "workstream_list",
                items: model.setupAreas.map((area) => ({
                    kind: "setup_area",
                    id: area.id,
                    summary: area.title,
                })),
            },
        ],
        capabilities: {
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: ["work/openScopeDialog", "context/toggleRail"],
        },
    };
}

// Work route contract composition.
export function buildWorkRouteContract({
    lens,
    now,
    model,
}: BuildWorkRouteContractParams): WorkRouteContract {
    const pageModel = buildWorkOverviewPageModel({
        lens,
        metrics: model.metrics,
        blockingTaskSummaries: model.blockingTaskSummaries,
        scopesInView: model.scopesInView,
    });

    const railPayloadCandidate = buildRailPayload({
        scope: { type: "work" },
        lens,
        asOf: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        aggregates: {
            topBlockingTaskIds: model.blockingTasks.map((task) => task.id),
            topBlockingTaskSummaries: model.blockingTaskSummaries
                .slice(0, 5)
                .map((taskSummary) => ({
                    id: taskSummary.id,
                    title: taskSummary.title,
                })),
            snapshot: model.railSnapshot,
            scopesInView: model.scopesInView,
        },
    });

    return {
        pageModel,
        railPayloadCandidate,
    };
}

export function buildFreshWorkRouteContract({
    lens,
    now,
    summary,
}: {
    lens: ScopeLens;
    now: Date;
    summary: StubBootstrapSummary | null;
}): WorkRouteContract {
    const model = buildFreshDashboardModel(summary, lens);
    const pageModel = buildFreshWorkOverviewPageModel({
        lens,
        summary,
        model,
    });

    return {
        pageModel,
        railPayloadCandidate: buildRailPayload({
            scope: { type: "work" },
            lens,
            asOf: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            aggregates: {
                topBlockingTaskIds: model.setupBlockers.map((item) => item.id),
                topBlockingTaskSummaries: model.setupBlockers.map((item) => ({
                    id: item.id,
                    title: item.title,
                })),
                snapshot: {
                    blockedChecks: model.setupBlockers.length,
                    overdueTasks: 0,
                    missingAttachments: 0,
                    tasksInScope: model.firstActionTaskIds.length,
                    unmappedChecks: 0,
                },
                scopesInView: model.setupAreas.map((area) => area.title),
            },
        }),
    };
}

export { buildDashboardViewModel };
