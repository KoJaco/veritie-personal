import { buildRailPayload } from "@/components/context/build-rail-payload";

describe("buildRailPayload", () => {
    it("projects explicit scope, lens, snapshot and aggregates", () => {
        const payload = buildRailPayload({
            scope: { type: "timeline" },
            lens: { scope: "work" },
            asOf: "2026-02-23T00:00:00.000Z",
            timezone: "Australia/Sydney",
            aggregates: {
                snapshot: {
                    blockedChecks: 2,
                    overdueTasks: 3,
                    missingAttachments: 4,
                    tasksTotal: 10,
                    tasksInScope: 7,
                    unmappedChecks: 1,
                    criteriaSetStatus: "valid",
                    windowStatus: "valid",
                    coverageGapDays: 9,
                },
                topBlockingTaskIds: ["t1", "t2"],
                topBlockingTaskSummaries: [{ id: "t1", title: "Task 1" }],
                scopesInView: ["Work"],
            },
        });

        expect(payload).not.toBeNull();
        if (!payload) {
            throw new Error("Expected payload to be present");
        }
        expect(payload.scope).toEqual({ type: "timeline" });
        expect(payload.data?.asOf).toBe("2026-02-23T00:00:00.000Z");
        expect(payload.data?.timezone).toBe("Australia/Sydney");
        expect(payload.data?.lens).toEqual({
            scope: "work",
        });
        expect(payload.data?.snapshot?.coverageGapDays).toBe(9);
        expect(payload.data?.topBlockingTaskIds).toEqual(["t1", "t2"]);
        expect(payload.data?.scopesInView).toEqual(["Work"]);
    });

    it("fills asOf/timezone defaults when omitted", () => {
        const payload = buildRailPayload({
            scope: { type: "timeline" },
        });

        expect(payload).not.toBeNull();
        if (!payload) {
            throw new Error("Expected payload to be present");
        }
        expect(payload.data?.asOf).toBeDefined();
        expect(Number.isNaN(new Date(payload.data?.asOf ?? "").getTime())).toBe(
            false,
        );
        expect(typeof payload.data?.timezone).toBe("string");
    });
});
