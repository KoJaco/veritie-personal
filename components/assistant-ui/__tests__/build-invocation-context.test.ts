import { describe, expect, it } from "@jest/globals";
import { buildInvocationContext } from "@/components/assistant-ui/build-invocation-context";

describe("buildInvocationContext", () => {
    it("builds minimal context with deterministic schema and route envelope", () => {
        const result = buildInvocationContext({
            routeId: "timeline",
            routeContext: null,
            focusContext: null,
            threadKey: "timeline",
        });

        expect(result).toMatchObject({
            schemaVersion: "assistant_invocation_context_v0",
            route: { routeId: "timeline" },
            focus: null,
            snapshot: {},
            meta: {
                threadKey: "timeline",
                source: "frontend_stub",
            },
        });
        expect(typeof result.meta.builtAt).toBe("string");
    });

    it("includes scope, snapshot, and focus pointers when available", () => {
        const result = buildInvocationContext({
            routeId: "task_detail",
            routeContext: {
                scope: { type: "task_detail", id: "task-123" },
                primaryObject: { type: "task", id: "task-123" },
                data: {
                    asOf: "2026-03-04T00:00:00.000Z",
                    lens: { scope: "work" },
                },
            },
            focusContext: {
                entityPointer: { kind: "task", id: "task-123" },
                subviewPointer: { kind: "section", id: "blocking" },
                intent: "triage",
            },
            threadKey: "task:task-123",
        });

        expect(result.route).toEqual({
            routeId: "task_detail",
            scopeType: "task_detail",
            scopeId: "task-123",
        });
        expect(result.snapshot).toEqual({
            asOf: "2026-03-04T00:00:00.000Z",
            lens: {
                scope: "work",
            },
            primaryObject: { type: "task", id: "task-123" },
        });
        expect(result.focus).toEqual({
            entityPointer: { kind: "task", id: "task-123" },
            subviewPointer: { kind: "section", id: "blocking" },
            intent: "triage",
        });
    });
});
