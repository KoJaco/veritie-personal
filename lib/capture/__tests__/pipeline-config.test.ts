import {
    parseExtractionListKeys,
    parseGlossaryLabels,
    resolvePipelineExtractionConfig,
    resolvePipelineExtractionConfigFromDefinitions,
} from "@/lib/capture/pipeline-config";
import { VOICE_LOG_EXTRACTION_LIST_KEYS } from "@/lib/capture/voice-log-extraction-schema";

describe("pipeline-config", () => {
    it("parses extraction list keys from schema entities", () => {
        const keys = parseExtractionListKeys({
            entities: [
                { key: "tasks", object_type: "task" },
                { collection_key: "expenses", object_type: "money_entry" },
            ],
        });

        expect(keys).toEqual(["tasks", "expenses"]);
    });

    it("parses glossary labels from entries", () => {
        const labels = parseGlossaryLabels({
            entries: [
                { key: "tasks", label: "Tasks" },
                { key: "expenses", label: "Expenses" },
            ],
        });

        expect(labels).toEqual({
            tasks: "Tasks",
            expenses: "Expenses",
        });
    });

    it("falls back to constants when config is null", () => {
        const resolved = resolvePipelineExtractionConfig(null);

        expect(resolved.extractionListKeys).toEqual([
            ...VOICE_LOG_EXTRACTION_LIST_KEYS,
        ]);
        expect(resolved.objectTypesByKey.tasks).toBe("task");
    });

    it("merges fetched config with fallback object types", () => {
        const resolved = resolvePipelineExtractionConfigFromDefinitions(
            {
                entities: [{ key: "tasks", object_type: "task" }],
            },
            {
                entries: [{ key: "tasks", label: "Open tasks" }],
            },
            "schema-version-42",
        );

        expect(resolved.extractionListKeys).toEqual(["tasks"]);
        expect(resolved.glossaryLabels.tasks).toBe("Open tasks");
        expect(resolved.schemaVersionId).toBe("schema-version-42");
    });
});
