import {
    buildWorkRouteContract,
    buildDashboardViewModel,
} from "../build";
import {
    enforceWorkRouteContract,
    validateWorkRouteContractShape,
} from "../validate";
import {
    getTaskSummariesStub,
    getTasksStub,
    getWorkDashboardStub,
} from "@/lib/stubs";

describe("dashboard route contract validation", () => {
    it("accepts a valid dashboard contract shape", () => {
        const now = new Date("2026-03-01T00:00:00.000Z");
        const lens = { scope: "all" as const };
        const tasks = getTasksStub(32);
        const dashboard = getWorkDashboardStub();
        const model = buildDashboardViewModel({
            lens,
            now,
            allTasks: tasks,
            activitySignals: dashboard.recentActivity,
            buildTaskSummaries: getTaskSummariesStub,
        });

        const contract = buildWorkRouteContract({ lens, now, model });
        const result = validateWorkRouteContractShape(contract);

        expect(result.ok).toBe(true);
    });

    it("fails closed when contract shape is invalid", () => {
        const result = validateWorkRouteContractShape({
            pageModel: {
                meta: { title: "Work" },
                view: { key: "work_overview" },
                sections: [],
                capabilities: {},
                actions: { available: [] },
            },
            railPayloadCandidate: null,
            debug: true,
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "INVALID_SHAPE",
        });
    });

    it("returns null payload when page model validation fails", () => {
        const now = new Date("2026-03-01T00:00:00.000Z");
        const lens = { scope: "all" as const };
        const tasks = getTasksStub(32);
        const dashboard = getWorkDashboardStub();
        const model = buildDashboardViewModel({
            lens,
            now,
            allTasks: tasks,
            activitySignals: dashboard.recentActivity,
            buildTaskSummaries: () => [
                {
                    id: "task-huge",
                    title: "x".repeat(40_000),
                    status: "todo",
                    priority: "high",
                    dueAt: null,
                    blockingReason: "forced",
                },
            ],
        });

        const contract = buildWorkRouteContract({ lens, now, model });
        const result = enforceWorkRouteContract(contract);

        expect(result.pageModelValidation.ok).toBe(false);
        expect(result.railPayload).toBeNull();
    });
});
