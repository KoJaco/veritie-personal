import "server-only";

import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    createResource as createResourceRepo,
    getResourceDetail as getResourceDetailRepo,
    getResourcesIndex as getResourcesIndexRepo,
} from "@/lib/db/repositories/resources";
import type { ResourceIndexQuery } from "../resources-read-model";
import type { ResourcesReadAdapter } from "../types";

async function getResourcesIndexAll() {
    const scope = await requireAccountScope();
    return getResourcesIndexRepo(scope);
}

async function getResourcesIndexWithQuery(query: ResourceIndexQuery) {
    const scope = await requireAccountScope();
    return getResourcesIndexRepo(scope, query);
}

async function getResourcesIndexWithCount(count: number) {
    const scope = await requireAccountScope();
    const index = await getResourcesIndexRepo(scope);
    return index.items.slice(0, count);
}

const getResourcesIndexImpl = ((
    countOrQuery?: number | ResourceIndexQuery,
) => {
    if (typeof countOrQuery === "number") {
        return getResourcesIndexWithCount(countOrQuery);
    }
    if (countOrQuery !== undefined) {
        return getResourcesIndexWithQuery(countOrQuery);
    }
    return getResourcesIndexAll();
}) as ResourcesReadAdapter["getResourcesIndex"];

export const backendResourcesAdapter: ResourcesReadAdapter = {
    getResourcesIndex: getResourcesIndexImpl,
    getResourceDetail: async (id) => {
        const scope = await requireAccountScope();
        const detail = await getResourceDetailRepo(scope, id);
        if (!detail) {
            throw new Error(`[data-source] unknown resource id: ${id}`);
        }
        return detail;
    },
    createResource: async (input) => {
        const scope = await requireAccountScope();
        return createResourceRepo(scope, input);
    },
};
