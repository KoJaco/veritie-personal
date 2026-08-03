import { buildDashboardViewModel } from "../build";
import type { TaskStub } from "@/lib/stubs";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

// ! data shapes will be overridden when we connect to our backend. Tests must be reconstructed.

const assignee = {
    id: "user_1",
    name: "Test User",
    email: "test@example.com",
    isMe: true,
};

function makeTask(overrides: Partial<TaskStub>): TaskStub {
    return {
        id: "task_default",
        title: "Default task",
        status: "todo",
        priority: "medium",
        dueAt: null,
        assignee,
        relatedObject: {
            id: "check_default",
            type: "procedure",
            title: "Access Control",
        },
        attachmentStatus: "required",
        missingAttachmentCount: 0,
        updatedAt: "2026-02-20T00:00:00.000Z",
        scopeIds: ["operations-readiness"],
        ...overrides,
    };
}

describe("buildDashboardViewModel", () => {
    const now = new Date("2026-02-23T00:00:00.000Z");

    it("filters tasks by delivery observability lens and derives expected metrics", () => {
        const allTasks: TaskStub[] = [
            makeTask({ id: "soc2_i", scopeIds: ["operations-readiness"] }),
            makeTask({
                id: "soc2_ii_blocked",
                title: "Type II blocked",
                status: "blocked",
                dueAt: "2026-02-20T00:00:00.000Z",
                scopeIds: ["delivery-observability"],
                missingAttachmentCount: 1,
                relatedObject: {
                    id: "check_t2",
                    type: "procedure",
                    title: "Monitoring check",
                },
            }),
            makeTask({
                id: "e8_task",
                scopeIds: ["workspace-resilience"],
                relatedObject: {
                    id: "check_e8",
                    type: "procedure",
                    title: "Patch management",
                },
            }),
            makeTask({
                id: "iso_task",
                scopeIds: ["knowledge-hygiene"],
                relatedObject: {
                    id: "check_iso",
                    type: "procedure",
                    title: "Incident response",
                },
            }),
        ];

        const model = buildDashboardViewModel({
            lens: { scope: "delivery-observability" },
            now,
            allTasks,
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.tasks).toHaveLength(1);
        expect(model.metrics.tasksTotal).toBe(4);
        expect(model.metrics.tasksInScope).toBe(1);
        expect(model.metrics.blockedChecks).toBe(1);
        expect(model.metrics.overdueTasks).toBe(1);
        expect(model.metrics.criteriaSetStatus).toBe("invalid");
        expect(model.metrics.windowStatus).toBe("valid");
        expect(model.metrics.coverageGapDays).toBe(5);
        expect(model.narrative[0]).toContain(
            "Scope mapping is invalid",
        );
        expect(model.scopesInView).toEqual(
            expect.arrayContaining([
                "Operations Readiness",
                "Delivery Observability",
                "Workspace Resilience",
                "Knowledge Hygiene",
            ]),
        );
    });

    it("returns valid delivery observability window status for the canonical scope", () => {
        const model = buildDashboardViewModel({
            lens: { scope: "delivery-observability" },
            now,
            allTasks: [
                makeTask({
                    id: "soc2_ii",
                    scopeIds: ["delivery-observability"],
                    relatedObject: {
                        id: "check_t2",
                        type: "procedure",
                        title: "Monitoring",
                    },
                }),
            ],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.metrics.windowStatus).toBe("valid");
    });

    it("counts unmapped checks only for open tasks", () => {
        const model = buildDashboardViewModel({
            lens: { scope: "all" },
            now,
            allTasks: [
                makeTask({
                    id: "unmapped_open",
                    relatedObject: undefined,
                    status: "todo",
                }),
                makeTask({
                    id: "unmapped_done",
                    relatedObject: undefined,
                    status: "done",
                }),
                makeTask({ id: "mapped_open", status: "todo" }),
            ],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.metrics.unmappedChecks).toBe(1);
    });

    it("handles empty task input safely", () => {
        const model = buildDashboardViewModel({
            lens: { scope: "all" },
            now,
            allTasks: [],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.tasks).toEqual([]);
        expect(model.metrics.tasksTotal).toBe(0);
        expect(model.metrics.checksTotal).toBe(0);
        expect(model.metrics.completionPercent).toBe(0);
        expect(model.blockingTasks).toEqual([]);
        expect(model.dueSoonTasks).toEqual([]);
        expect(model.quickWinTasks).toEqual([]);
    });

    it("reports 100% completion when all scoped tasks are done and mapped", () => {
        const model = buildDashboardViewModel({
            lens: { scope: "operations-readiness" },
            now,
            allTasks: [
                makeTask({
                    id: "done_1",
                    status: "done",
                    scopeIds: ["operations-readiness"],
                    relatedObject: {
                        id: "c1",
                        type: "procedure",
                        title: "Access control policy",
                    },
                }),
                makeTask({
                    id: "done_2",
                    status: "done",
                    scopeIds: ["operations-readiness"],
                    relatedObject: {
                        id: "c2",
                        type: "procedure",
                        title: "Vendor risk check",
                    },
                }),
            ],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.metrics.checksTotal).toBe(2);
        expect(model.metrics.checksComplete).toBe(2);
        expect(model.metrics.completionPercent).toBe(100);
    });

    it("filters by workspace resilience and knowledge hygiene lenses", () => {
        const allTasks: TaskStub[] = [
            makeTask({ id: "soc2_i", scopeIds: ["operations-readiness"] }),
            makeTask({
                id: "e8_task",
                scopeIds: ["workspace-resilience"],
                relatedObject: {
                    id: "e8_1",
                    type: "procedure",
                    title: "Patch applications strategy",
                },
            }),
            makeTask({
                id: "iso_task",
                scopeIds: ["knowledge-hygiene"],
                relatedObject: {
                    id: "iso_1",
                    type: "procedure",
                    title: "Incident response process",
                },
            }),
        ];

        const e8Model = buildDashboardViewModel({
            lens: { scope: "workspace-resilience" },
            now,
            allTasks,
            activitySignals: [],
            buildTaskSummaries: () => [],
        });
        const isoModel = buildDashboardViewModel({
            lens: { scope: "knowledge-hygiene" },
            now,
            allTasks,
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(e8Model.tasks).toHaveLength(1);
        expect(e8Model.tasks[0]?.id).toBe("e8_task");
        expect(isoModel.tasks).toHaveLength(1);
        expect(isoModel.tasks[0]?.id).toBe("iso_task");
    });

    it("builds due-soon and quick-win groups with expected filtering", () => {
        const allTasks: TaskStub[] = [
            makeTask({
                id: "due_soon",
                dueAt: "2026-02-26T00:00:00.000Z",
                priority: "high",
                scopeIds: ["operations-readiness"],
            }),
            makeTask({
                id: "quick_win",
                dueAt: null,
                priority: "low",
                missingAttachmentCount: 0,
                status: "todo",
                updatedAt: "2026-02-22T00:00:00.000Z",
                scopeIds: ["operations-readiness"],
            }),
            makeTask({
                id: "excluded_quick_win_blocked",
                status: "blocked",
                priority: "low",
                scopeIds: ["operations-readiness"],
            }),
            makeTask({
                id: "excluded_quick_win_missing_attachment",
                priority: "low",
                missingAttachmentCount: 2,
                scopeIds: ["operations-readiness"],
            }),
            makeTask({
                id: "outside_due_soon_window",
                dueAt: "2026-03-20T00:00:00.000Z",
                scopeIds: ["operations-readiness"],
            }),
        ];

        const model = buildDashboardViewModel({
            lens: { scope: "operations-readiness" },
            now,
            allTasks,
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.dueSoonTasks.map((t) => t.id)).toEqual(["due_soon"]);
        expect(model.quickWinTasks.map((t) => t.id)).toEqual([
            "quick_win",
            "outside_due_soon_window",
        ]);
    });

    it("builds story-centric workstreams with real cross-route targets", () => {
        const allTasks = stubDataSourceAdapters.dashboard.getTasks(32);
        const model = buildDashboardViewModel({
            lens: { scope: "all" },
            now,
            allTasks,
            activitySignals:
                stubDataSourceAdapters.dashboard.getWorkDashboard().recentActivity,
            buildTaskSummaries: stubDataSourceAdapters.dashboard.getTaskSummaries,
        });

        expect(model.workstreams[0]?.title).toBe("Access governance");
        expect(model.workstreams[0]?.taskHref).toContain(
            "/work/tasks?",
        );
        expect(model.workstreams[0]?.taskHref).toContain(
            "check=policy-access-governance",
        );
        expect(model.workstreams[0]?.taskHref).toContain(
            "check=check-narrative",
        );
        expect(model.workstreams[0]?.taskHref).toContain(
            "scope=all",
        );
    });

    it("keeps custom window valid but remains fail-closed when criteria mapping is invalid", () => {
        const model = buildDashboardViewModel({
            lens: { scope: "delivery-observability" },
            now,
            allTasks: [
                makeTask({
                    id: "soc2_custom_window",
                    scopeIds: ["delivery-observability"],
                    relatedObject: {
                        id: "c_custom",
                        type: "procedure",
                        title: "Monitoring check",
                    },
                }),
            ],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.metrics.windowStatus).toBe("valid");
        expect(model.metrics.criteriaSetStatus).toBe("invalid");
        expect(model.narrative[0]).toContain(
            "Scope mapping is invalid",
        );
    });

    it("sorts blocking tasks by due date when priority ties", () => {
        const model = buildDashboardViewModel({
            lens: { scope: "operations-readiness" },
            now,
            allTasks: [
                makeTask({
                    id: "blocked_later",
                    status: "blocked",
                    priority: "high",
                    dueAt: "2026-02-27T00:00:00.000Z",
                    scopeIds: ["operations-readiness"],
                }),
                makeTask({
                    id: "blocked_earlier",
                    status: "blocked",
                    priority: "high",
                    dueAt: "2026-02-24T00:00:00.000Z",
                    scopeIds: ["operations-readiness"],
                }),
            ],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(model.blockingTasks.map((t) => t.id)).toEqual([
            "blocked_earlier",
            "blocked_later",
        ]);
    });

    it("filters canonical activity signals by lens and handles unknown scope as empty scope", () => {
        const withSoc2TypeI = buildDashboardViewModel({
            lens: { scope: "operations-readiness" },
            now,
            allTasks: stubDataSourceAdapters.dashboard.getTasks(32),
            activitySignals:
                stubDataSourceAdapters.dashboard.getWorkDashboard().recentActivity,
            buildTaskSummaries: stubDataSourceAdapters.dashboard.getTaskSummaries,
        });

        expect(
            withSoc2TypeI.activitySignals.some(
                (signal) => signal.target.id === "task-access-provisioning-validation",
            ),
        ).toBe(true);
        expect(
            withSoc2TypeI.activitySignals.some(
                (signal) => signal.target.id === "task-iso-gap-remediation",
            ),
        ).toBe(false);

        const unknownLens = buildDashboardViewModel({
            lens: { scope: "unknown" as never },
            now,
            allTasks: [
                makeTask({
                    id: "soc2_scoped",
                    scopeIds: ["operations-readiness"],
                }),
            ],
            activitySignals: [],
            buildTaskSummaries: () => [],
        });

        expect(unknownLens.tasks).toEqual([]);
    });
});
