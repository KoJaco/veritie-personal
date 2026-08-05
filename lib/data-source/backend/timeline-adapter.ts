import "server-only";

import {
    requireAccountScope,
} from "@/lib/db/repositories/context";
import {
    getTimelineEventDetail as getTimelineEventDetailRepo,
    getTimelineIndex as getTimelineIndexRepo,
} from "@/lib/db/repositories/timeline";
import type { TimelineReadAdapter } from "../types";

export const backendTimelineAdapter: TimelineReadAdapter = {
    getTimelineIndex: async (query) => {
        const scope = await requireAccountScope();
        return getTimelineIndexRepo(scope, query);
    },
    getTimelineEventDetail: async (id) => {
        const scope = await requireAccountScope();
        return getTimelineEventDetailRepo(scope, id);
    },
};
