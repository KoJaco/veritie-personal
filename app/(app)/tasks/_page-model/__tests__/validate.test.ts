import {
    enforceTasksRouteContract,
    validateTasksRouteContractShape,
} from "../validate";
import { buildTasksRouteContract } from "../build";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

describe("validateTasksRouteContractShape", () => {
    it("rejects invalid tasks route contract shapes", () => {
        const result = validateTasksRouteContractShape({
            pageModel: {},
            railPayloadCandidate: {},
        });

        expect(result.ok).toBe(false);
    });

    it("fails closed when the page model becomes invalid", () => {
        const contract = buildTasksRouteContract({
            scope: "tasks_index",
            lens: { scope: "all" },
            tasksIndex: stubDataSourceAdapters.tasks.getTasksIndex(),
        });

        const enforced = enforceTasksRouteContract({
            ...contract,
            pageModel: {
                ...contract.pageModel,
                sections: [
                    {
                        key: "invalid",
                        kind: "task_list",
                        items: [
                            {
                                kind: "task",
                                id: "task_1",
                                rawMarkdown: "# invalid",
                            },
                        ],
                    },
                ],
            } as never,
        });

        expect(enforced.pageModelValidation.ok).toBe(false);
        expect(enforced.payload).toBeNull();
    });
});
