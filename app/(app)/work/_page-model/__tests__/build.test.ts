import {
    buildWorkRouteContract,
    buildDashboardViewModel,
} from "../build";
import { enforceWorkRouteContract } from "../validate";
import {
    getTaskSummariesStub,
    getTasksStub,
    getWorkDashboardStub,
    type TaskSummaryStub,
} from "@/lib/stubs";

describe("buildWorkRouteContract", () => {
    it("composes page model + payload candidate and enforces valid contracts", () => {
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

        const composed = buildWorkRouteContract({
            lens,
            now,
            model,
        });
        const contracts = enforceWorkRouteContract(composed);

        expect(composed.pageModel).toBeDefined();
        expect(composed.railPayloadCandidate).not.toBeNull();
        expect(contracts.pageModelValidation.ok).toBe(true);
        expect(contracts.railPayload).not.toBeNull();
    });

    it("fails closed during enforcement when PageModel validation fails", () => {
        const now = new Date("2026-03-01T00:00:00.000Z");
        const lens = { scope: "all" as const };
        const tasks = getTasksStub(32);
        const dashboard = getWorkDashboardStub();

        const hugeTitle = "x".repeat(40_000);

        const model = buildDashboardViewModel({
            lens,
            now,
            allTasks: tasks,
            activitySignals: dashboard.recentActivity,
            buildTaskSummaries: () =>
                [
                    {
                        id: "task-huge",
                        title: hugeTitle,
                        status: "todo",
                        priority: "high",
                        dueAt: null,
                        blockingReason: "forced",
                    },
                ] as TaskSummaryStub[],
        });

        const composed = buildWorkRouteContract({
            lens,
            now,
            model,
        });
        const contracts = enforceWorkRouteContract(composed);

        expect(contracts.pageModelValidation.ok).toBe(false);
        if (contracts.pageModelValidation.ok) {
            throw new Error("Expected page model validation to fail");
        }
        expect(contracts.pageModelValidation.errorCode).toBe(
            "HARD_LIMIT_EXCEEDED",
        );
        expect(contracts.railPayload).toBeNull();
    });
});
