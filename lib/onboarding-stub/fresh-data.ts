import type {
    TaskActivityItemReadModel,
    TaskDetailReadModel,
    TaskIndexItemReadModel,
    TaskIndexSummaryReadModel,
    TaskResourceSummaryReadModel,
    TasksIndexQuery,
    TasksIndexReadModel,
    TaskUiStatus,
} from "@/lib/data-source/tasks-read-model";
import {
    applyTasksIndexQuery,
    isTaskOverdue,
    summarizeTasksIndex,
} from "@/lib/data-source/tasks-read-model";
import type { ScopeLens } from "@/lib/lens";
import { scopeIdsMatchLens } from "@/lib/lens/scope-matching";
import type { OnboardingAiMode, StubBootstrapSummary } from "./types";
import { getIndustryLabel } from "./state";

type FreshDashboardMetric = {
    id: string;
    label: string;
    value: number;
    tone?: "neutral" | "warning" | "risk";
};

export type FreshDashboardOverview = {
    title: string;
    description: string;
    metrics: FreshDashboardMetric[];
};

export type FreshDashboardAction = {
    id: string;
    title: string;
    href: string;
    description: string;
    tone?: "neutral" | "warning";
};

export type FreshDashboardArea = {
    id: string;
    title: string;
    summary: string;
    statusNote: string;
    progress: number;
    openTaskCount: number;
    taskHref: string;
};

export type FreshDashboardModel = {
    overview: FreshDashboardOverview;
    firstActions: FreshDashboardAction[];
    setupBlockers: FreshDashboardAction[];
    setupAreas: FreshDashboardArea[];
    firstActionTaskIds: string[];
};

type FreshTaskSeed = {
    id: string;
    title: string;
    description: string;
    checkTitle: string;
    status: TaskUiStatus;
    dueAt: string | null;
    ownerName: string;
    blockerSummary?: string;
    group: "integrations" | "documents" | "resources" | "ownership";
    activity: TaskActivityItemReadModel[];
    documents: TaskDetailReadModel["documents"];
    attachments: TaskDetailReadModel["attachments"];
    resource?: TaskResourceSummaryReadModel;
};

const SETUP_OWNER = {
    id: "user_current",
    name: "You",
    email: "you@example.local",
    isMe: true,
};

const DEFAULT_SUMMARY: StubBootstrapSummary = {
    companySize: "11_50",
    industry: "saas",
    dataSensitivity: "moderate",
    aiMode: "guided",
};

function getActiveSummary(
    summary: StubBootstrapSummary | null,
): StubBootstrapSummary {
    return summary ?? DEFAULT_SUMMARY;
}

function buildTaskSeeds(summaryInput: StubBootstrapSummary | null): FreshTaskSeed[] {
    const summary = getActiveSummary(summaryInput);
    const industryLabel = getIndustryLabel(summary.industry);
    const securityTone =
        summary.dataSensitivity === "high"
            ? "high-sensitivity handling expectations"
            : summary.dataSensitivity === "moderate"
              ? "core operational safeguards"
              : "baseline documentation and ownership";

    const seeds: FreshTaskSeed[] = [
        {
            id: "fresh-task-assign-owners",
            title: "Assign setup owners across your baseline checks",
            description:
                "Give the first setup areas clear owners so the rest of the bootstrap work can move without ambiguity.",
            checkTitle: "Workspace ownership and accountability",
            status: "open",
            dueAt: "2026-04-10T00:00:00.000Z",
            ownerName: "You",
            group: "ownership",
            activity: [
                {
                    id: "fresh-activity-owners",
                    type: "task_updated",
                    summary:
                        "The workspace created this owner-assignment task from the onboarding bootstrap.",
                    occurredAt: "2026-04-07T09:00:00.000Z",
                },
            ],
            documents: [],
            attachments: [],
        },
        {
            id: "fresh-task-create-policies",
            title: "Create your baseline document set",
            description: `Start a lightweight document pack for ${industryLabel.toLowerCase()} operations and ${securityTone}.`,
            checkTitle: "Documented check baseline",
            status: summary.aiMode === "guided" ? "in_progress" : "open",
            dueAt: "2026-04-12T00:00:00.000Z",
            ownerName: "You",
            group: "documents",
            activity: [
                {
                    id: "fresh-activity-policies",
                    type: "task_updated",
                    summary:
                        "Starter document scaffolds are ready to be created from the setup queue.",
                    occurredAt: "2026-04-07T09:05:00.000Z",
                },
            ],
            documents: [],
            attachments: [],
        },
        {
            id: "fresh-task-define-assets",
            title: "Define the first critical resources in scope",
            description:
                "Capture the services, data stores, and core business systems that should anchor your initial posture model.",
            checkTitle: "Resource inventory",
            status: "blocked",
            dueAt: "2026-04-14T00:00:00.000Z",
            ownerName: "You",
            blockerSummary:
                "No resource owners have been assigned yet, so inventory scoping would stall immediately.",
            group: "resources",
            activity: [
                {
                    id: "fresh-activity-assets",
                    type: "blocker_noted",
                    summary:
                        "The workspace marked resource definition as blocked until a baseline owner exists.",
                    occurredAt: "2026-04-07T09:10:00.000Z",
                },
            ],
            documents: [],
            attachments: [],
        },
        {
            id: "fresh-task-plan-integrations",
            title: "Plan the first integrations you want to prepare",
            description:
                "Identify the systems that matter first so the setup dashboard can prioritize the right workstreams.",
            checkTitle: "Integration planning",
            status: "open",
            dueAt: "2026-04-11T00:00:00.000Z",
            ownerName: "You",
            group: "integrations",
            activity: [
                {
                    id: "fresh-activity-integrations",
                    type: "task_updated",
                    summary:
                        "The setup queue is ready to stage integration planning work.",
                    occurredAt: "2026-04-07T09:15:00.000Z",
                },
            ],
            documents: [],
            attachments: [],
        },
        {
            id: "fresh-task-start-attachment-plan",
            title: "Start the attachment and operating proof plan",
            description:
                "Identify where your first proof artifacts will come from before workload-specific attachments start to accumulate.",
            checkTitle: "Attachment posture groundwork",
            status: summary.aiMode === "strict" ? "in_progress" : "open",
            dueAt: "2026-04-16T00:00:00.000Z",
            ownerName: "You",
            group: "documents",
            activity: [
                {
                    id: "fresh-activity-attachment",
                    type: "task_updated",
                    summary:
                        "The workspace generated a baseline attachment-planning task from the onboarding bootstrap.",
                    occurredAt: "2026-04-07T09:20:00.000Z",
                },
            ],
            documents: [],
            attachments: [],
        },
    ];

    if (summary.dataSensitivity === "high") {
        seeds.unshift({
            id: "fresh-task-data-guardrails",
            title: "Define high-sensitivity data handling guardrails",
            description:
                "Lock down handling expectations early so later document and attachment work reflects the right risk posture.",
            checkTitle: "Sensitive data handling baseline",
            status: "open",
            dueAt: "2026-04-09T00:00:00.000Z",
            ownerName: "You",
            group: "ownership",
            activity: [
                {
                    id: "fresh-activity-guardrails",
                    type: "task_updated",
                    summary:
                        "High-sensitivity onboarding inputs elevated this task to the front of the queue.",
                    occurredAt: "2026-04-07T08:55:00.000Z",
                },
            ],
            documents: [],
            attachments: [],
        });
    }

    return prioritizeSeeds(seeds, summary.aiMode);
}

function prioritizeSeeds(
    seeds: FreshTaskSeed[],
    aiMode: OnboardingAiMode,
): FreshTaskSeed[] {
    const priorityByMode: Record<
        OnboardingAiMode,
        Record<FreshTaskSeed["group"], number>
    > = {
        guided: {
            ownership: 0,
            integrations: 1,
            documents: 2,
            resources: 3,
        },
        strict: {
            ownership: 0,
            documents: 1,
            resources: 2,
            integrations: 3,
        },
        lean: {
            ownership: 0,
            resources: 1,
            integrations: 2,
            documents: 3,
        },
    };

    return [...seeds].sort((left, right) => {
        return (
            priorityByMode[aiMode][left.group] -
            priorityByMode[aiMode][right.group]
        );
    });
}

function mapSeedToTaskDetail(seed: FreshTaskSeed): TaskDetailReadModel {
    const isOverdue = isTaskOverdue(
        seed.dueAt,
        seed.status,
        new Date("2026-04-07T00:00:00.000Z"),
    );

    return {
        id: seed.id,
        title: seed.title,
        status: seed.status,
        sourceStatus:
            seed.status === "completed"
                ? "done"
                : seed.status === "blocked"
                  ? "blocked"
                  : seed.status === "in_progress"
                    ? "in_progress"
                    : "todo",
        dueAt: seed.dueAt,
        owner: {
            ...SETUP_OWNER,
            name: seed.ownerName,
        },
        check: {
            id: `${seed.id}-check`,
            title: seed.checkTitle,
        },
        scopeLabels: [],
        scopeIds: [],
        attachmentCount: seed.attachments.length,
        missingAttachmentCount: 0,
        resource: seed.resource,
        updatedAt: "2026-04-07T09:20:00.000Z",
        isOverdue,
        blockerSummary: seed.blockerSummary,
        description: seed.description,
        checkContext:
            "This setup task establishes baseline operating state before deeper operational work becomes meaningful.",
        documents: seed.documents,
        attachments: seed.attachments,
        resourceDetail: seed.resource,
        activity: seed.activity,
        blockers: seed.blockerSummary
            ? [
                  {
                      id: `${seed.id}-blocker`,
                      type: "dependency",
                      description: seed.blockerSummary,
                  },
              ]
            : [],
    };
}

export function buildFreshTaskDetails(
    summary: StubBootstrapSummary | null,
): TaskDetailReadModel[] {
    return buildTaskSeeds(summary).map(mapSeedToTaskDetail);
}

export function buildFreshTasksIndex(
    summary: StubBootstrapSummary | null,
    lens: ScopeLens,
    query?: TasksIndexQuery,
): TasksIndexReadModel {
    const details = buildFreshTaskDetails(summary);
    const items = details
        .map<TaskIndexItemReadModel>((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            sourceStatus: task.sourceStatus,
            dueAt: task.dueAt,
            owner: task.owner,
            check: task.check,
            scopeLabels: task.scopeLabels,
            scopeIds: task.scopeIds,
            attachmentCount: task.attachmentCount,
            missingAttachmentCount: task.missingAttachmentCount,
            resource: task.resource,
            updatedAt: task.updatedAt,
            isOverdue: task.isOverdue,
            blockerSummary: task.blockerSummary,
        }))
        .filter((task) => scopeIdsMatchLens(task.scopeIds, lens));

    return applyTasksIndexQuery(items, new Date("2026-04-07T00:00:00.000Z"), {
        ...query,
        lens,
    });
}

export function buildFreshTaskDetail(
    summary: StubBootstrapSummary | null,
    taskId: string,
    lens: ScopeLens,
): TaskDetailReadModel {
    const detail = buildFreshTaskDetails(summary).find((task) => task.id === taskId);

    if (!detail || !scopeIdsMatchLens(detail.scopeIds, lens)) {
        throw new Error(`[fresh-onboarding] missing task detail for ${taskId}`);
    }

    return detail;
}

export function buildFreshTaskSummary(
    summary: StubBootstrapSummary | null,
    lens: ScopeLens,
): TaskIndexSummaryReadModel {
    return summarizeTasksIndex(
        buildFreshTasksIndex(summary, lens).items,
        new Date("2026-04-07T00:00:00.000Z"),
    );
}

export function buildFreshDashboardModel(
    summaryInput: StubBootstrapSummary | null,
    lens: ScopeLens,
): FreshDashboardModel {
    const summary = getActiveSummary(summaryInput);
    const tasks = buildFreshTasksIndex(summary, lens).items;
    const firstActionTaskIds = tasks.slice(0, 4).map((task) => task.id);

    const overview: FreshDashboardOverview = {
        title: "Setup overview",
        description:
            "The workspace has enough context to generate a baseline setup state and the next tasks to tackle first.",
        metrics: [
            {
                id: "setup_tasks_open",
                label: "Open setup tasks",
                value: tasks.filter((task) => task.status !== "completed").length,
            },
            {
                id: "resources_defined",
                label: "Resources defined",
                value: 0,
                tone: "warning",
            },
            {
                id: "documents_created",
                label: "Documents created",
                value: 0,
                tone: "warning",
            },
            {
                id: "integrations_prepared",
                label: "Integrations prepared",
                value: 0,
                tone: "warning",
            },
        ],
    };

    const firstActions = tasks.slice(0, 4).map((task) => ({
        id: task.id,
        title: task.title,
        href: `/work/tasks/${task.id}`,
        description: `Linked setup area: ${task.check.title}.`,
        tone: task.status === "blocked" ? ("warning" as const) : ("neutral" as const),
    }));

    const setupBlockers: FreshDashboardAction[] = [
        {
            id: "setup-blocker-owners",
            title: "No owners assigned to the initial setup areas",
            href: "/work/tasks/fresh-task-assign-owners",
            description:
                "Ownership needs to be explicit before resources, documents, and attachment work can move cleanly.",
            tone: "warning",
        },
        {
            id: "setup-blocker-assets",
            title: "No resources have been defined yet",
            href: "/work/tasks/fresh-task-define-assets",
            description:
                "Resource inventory is still empty, so check mapping and attachment planning would be speculative.",
            tone: "warning",
        },
        {
            id: "setup-blocker-documents",
            title: "No baseline documents exist yet",
            href: "/work/tasks/fresh-task-create-policies",
            description:
                "Start the baseline document set before deeper operational work appears complete on paper only.",
            tone: "warning",
        },
        {
            id: "setup-blocker-integrations",
            title: "No integrations have been prepared yet",
            href: "/work/tasks/fresh-task-plan-integrations",
            description:
                "The workspace can still guide setup, but your first integration workstream has not been staged yet.",
            tone: "warning",
        },
    ];

    const setupAreas: FreshDashboardArea[] = [
        {
            id: "integrations",
            title: "Integrations",
            summary: "No integrations prepared yet.",
            statusNote:
                "Use the setup queue to stage the first systems you want to connect later.",
            progress: 10,
            openTaskCount: tasks.filter(
                (task) => task.id === "fresh-task-plan-integrations",
            ).length,
            taskHref: "/work/tasks",
        },
        {
            id: "documents",
            title: "Documents",
            summary: "Baseline documents still need to be created.",
            statusNote:
                "Start with the minimum viable document pack that reflects your operating context.",
            progress: 5,
            openTaskCount: tasks.filter(
                (task) =>
                    task.id === "fresh-task-create-policies" ||
                    task.id === "fresh-task-start-attachment-plan",
            ).length,
            taskHref: "/work/tasks",
        },
        {
            id: "resources",
            title: "Resources",
            summary: "No posture resources have been defined yet.",
            statusNote:
                "Capture the systems and data stores that matter first before check mapping fans out.",
            progress: 0,
            openTaskCount: tasks.filter(
                (task) => task.id === "fresh-task-define-assets",
            ).length,
            taskHref: "/work/tasks",
        },
        {
            id: "ownership",
            title: "Ownership",
            summary: "Ownership and guardrails are still being established.",
            statusNote:
                summary.dataSensitivity === "high"
                    ? "High-sensitivity onboarding inputs are pushing identity and data guardrails to the front."
                    : "Assign accountable owners first so setup work has a clear operating path.",
            progress: summary.dataSensitivity === "high" ? 20 : 15,
            openTaskCount: tasks.filter(
                (task) =>
                    task.id === "fresh-task-assign-owners" ||
                    task.id === "fresh-task-data-guardrails",
            ).length,
            taskHref: "/work/tasks",
        },
    ];

    return {
        overview,
        firstActions,
        setupBlockers,
        setupAreas,
        firstActionTaskIds,
    };
}
