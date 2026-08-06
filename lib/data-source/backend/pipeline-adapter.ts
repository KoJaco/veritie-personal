import "server-only";

import { getServerGlossaryLabels } from "@/lib/capture/pipeline-config-service.server";
import type { PipelineReadAdapter } from "../types";

export const backendPipelineAdapter: PipelineReadAdapter = {
    getExtractionGlossaryLabels: () => getServerGlossaryLabels(),
};
