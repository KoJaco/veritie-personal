import {
    resolvePipelineExtractionConfigFromDefinitions,
} from "@/lib/capture/pipeline-config";
import { applyResolvedPipelineExtractionConfig } from "@/lib/capture/pipeline-config-service";
import type { PipelineReadAdapter } from "../types";

export const stubPipelineAdapter: PipelineReadAdapter = {
    getExtractionGlossaryLabels: async () => {
        const config = applyResolvedPipelineExtractionConfig(
            resolvePipelineExtractionConfigFromDefinitions(),
        );
        return config.glossaryLabels;
    },
};
