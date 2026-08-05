import "server-only";

import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    getTaskDetail as getTaskDetailRepo,
    getTasksIndex as getTasksIndexRepo,
} from "@/lib/db/repositories/tasks";
import type { TasksReadAdapter } from "../types";

export const backendTasksAdapter: TasksReadAdapter = {
    getTasksIndex: async (query) => {
        const scope = await requireAccountScope();
        return getTasksIndexRepo(scope, query);
    },
    getTaskDetail: async (id) => {
        const scope = await requireAccountScope();
        const detail = await getTaskDetailRepo(scope, id);
        if (!detail) {
            throw new Error(`[data-source] unknown task id: ${id}`);
        }
        return detail;
    },
};
