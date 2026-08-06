import {
    buildServerPipelineCacheKey,
    getServerPipelineExtractionConfig,
    resetServerPipelineExtractionConfigForTests,
} from "@/lib/capture/pipeline-config-service.server";
import { envServer } from "@/lib/config/env.server";
import type { VeritiePipelineConfigClient } from "@/lib/veritie/pipeline-config-client";

describe("pipeline-config-service.server", () => {
    beforeEach(() => {
        resetServerPipelineExtractionConfigForTests();
    });

    it("caches extraction config per pipeline cache key", async () => {
        const getPipelineConfig = jest.fn().mockResolvedValue({
            version: "v1",
            app: { id: "app", name: "App" },
            pipeline: { id: "pipe", name: "Pipe", alias: "alias-a" },
            settings: {
                entities_enabled: true,
                actions_enabled: false,
                action_mode: "suggest_only",
                ingest_mode: "batch_first",
            },
            schema: {
                id: "schema-a",
                version_id: "v1",
                version: 1,
                definition: {
                    entities: [{ key: "tasks", object_type: "task" }],
                },
            },
            glossary: {
                id: "glossary-a",
                version_id: "v1",
                version: 1,
                definition: {
                    entries: [{ key: "tasks", label: "Tasks" }],
                },
            },
            warnings: [],
        });

        const clientA: VeritiePipelineConfigClient = { getPipelineConfig };
        const clientB: VeritiePipelineConfigClient = {
            getPipelineConfig: jest.fn().mockResolvedValue({
                version: "v1",
                app: { id: "app", name: "App" },
                pipeline: { id: "pipe", name: "Pipe", alias: "alias-b" },
                settings: {
                    entities_enabled: true,
                    actions_enabled: false,
                    action_mode: "suggest_only",
                    ingest_mode: "batch_first",
                },
                schema: {
                    id: "schema-b",
                    version_id: "v1",
                    version: 1,
                    definition: {
                        entities: [{ key: "reminders", object_type: "reminder" }],
                    },
                },
                glossary: {
                    id: "glossary-b",
                    version_id: "v1",
                    version: 1,
                    definition: {
                        entries: [{ key: "reminders", label: "Reminders" }],
                    },
                },
                warnings: [],
            }),
        };

        const keyA = "https://veritie.test|alias-a";
        const keyB = "https://veritie.test|alias-b";

        const [firstA, secondA] = await Promise.all([
            getServerPipelineExtractionConfig(clientA, keyA),
            getServerPipelineExtractionConfig(clientA, keyA),
        ]);
        const configB = await getServerPipelineExtractionConfig(clientB, keyB);

        expect(firstA).toBe(secondA);
        expect(getPipelineConfig).toHaveBeenCalledTimes(1);
        expect(configB.extractionListKeys).toEqual(["reminders"]);
        expect(configB.glossaryLabels.reminders).toBe("Reminders");
    });

    it("builds fallback cache key when Veritie env is missing", () => {
        const originalUrl = envServer.veritieApiUrl;
        const originalAlias = envServer.veritiePipelineAlias;
        Object.assign(envServer, {
            veritieApiUrl: undefined,
            veritiePipelineAlias: undefined,
        });

        expect(buildServerPipelineCacheKey()).toBe("fallback");

        Object.assign(envServer, {
            veritieApiUrl: originalUrl,
            veritiePipelineAlias: originalAlias,
        });
    });
});
