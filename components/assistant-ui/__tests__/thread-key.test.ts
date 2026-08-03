import { describe, expect, it } from "@jest/globals";

import { getThreadKey } from "@/components/assistant-ui/thread-key";

describe("getThreadKey", () => {
    it("returns routeId when context is missing", () => {
        expect(getThreadKey("timeline", undefined)).toBe("timeline");
    });

    it("returns fallback routeId when scope does not match route", () => {
        const context = {
            scope: { type: "task_detail", id: "task-1" },
        } as const;

        expect(getThreadKey("resources_detail", context as never)).toBe(
            "resources_detail",
        );
    });

    it("maps task detail scope to deterministic thread key", () => {
        const context = {
            scope: { type: "task_detail", id: "task-123" },
        } as const;

        expect(getThreadKey("task_detail", context as never)).toBe(
            "task:task-123",
        );
    });

    it("maps records detail and index scopes", () => {
        const detailContext = {
            scope: { type: "records_detail", id: "obj-7" },
        } as const;

        const indexContext = {
            scope: { type: "records_index" },
        } as const;

        expect(getThreadKey("records_detail", detailContext as never)).toBe(
            "record:obj-7",
        );
        expect(getThreadKey("records_index", indexContext as never)).toBe(
            "records:index",
        );
    });

    it("maps capture detail scope", () => {
        const context = {
            scope: { type: "capture_detail", id: "capture-1" },
        } as const;

        expect(getThreadKey("capture_detail", context as never)).toBe(
            "capture:capture-1",
        );
    });

    it("maps resources detail and index scopes", () => {
        const detailContext = {
            scope: { type: "resources_detail", id: "resource-7" },
        } as const;

        const indexContext = {
            scope: { type: "resources_index" },
        } as const;

        expect(getThreadKey("resources_detail", detailContext as never)).toBe(
            "resource:resource-7",
        );
        expect(getThreadKey("resources_index", indexContext as never)).toBe(
            "resource:index",
        );
    });

    it("maps timeline route", () => {
        const context = { scope: { type: "timeline" } } as const;

        expect(getThreadKey("timeline", context as never)).toBe("timeline");
    });
});
