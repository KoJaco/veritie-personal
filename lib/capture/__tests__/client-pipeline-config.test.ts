import {
    getClientPipelineExtractionConfig,
    resetClientPipelineExtractionConfigForTests,
} from "@/lib/capture/client-pipeline-config";

describe("client-pipeline-config", () => {
    beforeEach(() => {
        resetClientPipelineExtractionConfigForTests();
    });

    it("deduplicates concurrent fetches", async () => {
        const getPipelineConfig = jest
            .fn()
            .mockResolvedValue({
                version: "v1",
                app: { id: "app", name: "App" },
                pipeline: { id: "pipe", name: "Pipe", alias: "proxy" },
                settings: {
                    entities_enabled: true,
                    actions_enabled: false,
                    action_mode: "suggest_only",
                    ingest_mode: "batch_first",
                },
                schema: null,
                glossary: null,
                warnings: [],
            });

        const [first, second] = await Promise.all([
            getClientPipelineExtractionConfig(getPipelineConfig),
            getClientPipelineExtractionConfig(getPipelineConfig),
        ]);

        expect(first).toBe(second);
        expect(getPipelineConfig).toHaveBeenCalledTimes(1);
    });
});
