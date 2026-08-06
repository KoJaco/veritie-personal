import { buildTasksRouteContract } from "../build";
import { enforceTasksRouteContract } from "../validate";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

describe("buildTasksRouteContract", () => {
    it("builds a valid tasks index contract", async () => {
        const contract = buildTasksRouteContract({
            scope: "tasks_index",
            lens: { scope: "all" },
            tasksIndex: await stubDataSourceAdapters.tasks.getTasksIndex(),
        });

        const enforced = enforceTasksRouteContract(contract);

        expect(enforced.pageModelValidation.ok).toBe(true);
        expect(enforced.payload?.scope.type).toBe("task_index");
    });

    it("builds a valid task detail contract", async () => {
        const detail = await stubDataSourceAdapters.tasks.getTaskDetail(
            "task-ac-policy-review",
        );
        const contract = buildTasksRouteContract({
            scope: "task_detail",
            lens: { scope: "work" },
            taskDetail: detail,
        });

        const enforced = enforceTasksRouteContract(contract);

        expect(enforced.pageModelValidation.ok).toBe(true);
        expect(enforced.payload?.scope).toEqual({
            type: "task_detail",
            id: detail.id,
        });
    });
});
