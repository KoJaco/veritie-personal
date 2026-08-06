import "server-only";

import { requireAccountScope } from "@/lib/db/repositories/context";
import {
    getCaptureDetail as getCaptureDetailRepo,
    getCapturesIndex as getCapturesIndexRepo,
} from "@/lib/db/repositories/captures";
import type { CapturesReadAdapter } from "../types";

export const backendCapturesAdapter: CapturesReadAdapter = {
    getCapturesIndex: async (query) => {
        const scope = await requireAccountScope();
        return getCapturesIndexRepo(scope, query);
    },
    getCaptureDetail: async (id) => {
        const scope = await requireAccountScope();
        return getCaptureDetailRepo(scope, id);
    },
};
