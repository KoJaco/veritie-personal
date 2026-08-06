import "server-only";

import { requireAccountScope } from "@/lib/db/repositories/context";
import { getSettings as getSettingsRepo } from "@/lib/db/repositories/settings";
import type { SettingsReadAdapter } from "../types";

export const backendSettingsAdapter: SettingsReadAdapter = {
    getSettings: async () => {
        const scope = await requireAccountScope();
        return getSettingsRepo(scope);
    },
};
