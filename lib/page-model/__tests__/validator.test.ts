import { validatePageModel } from "@/lib/page-model";
import { buildWorkOverviewPageModel } from "@/app/(app)/work/_page-model/build";
import {
    PAYLOAD_HARD_LIMIT_BYTES,
    PAYLOAD_SOFT_LIMIT_BYTES,
} from "@/lib/contracts/validation";
import type { DashboardMetrics } from "@/app/(app)/work/_page-model/composeVM";

const baseMetrics: DashboardMetrics = {
    tasksTotal: 20,
    tasksInScope: 10,
    checksComplete: 4,
    checksTotal: 8,
    blockedChecks: 2,
    overdueTasks: 3,
    missingAttachments: 5,
    unmappedChecks: 1,
    completionPercent: 50,
};

describe("validatePageModel", () => {
    it("accepts a valid minimal dashboard page model", () => {
        const pageModel = buildWorkOverviewPageModel({
            lens: { scope: "delivery-observability" },
            metrics: baseMetrics,
            blockingTaskSummaries: [
                {
                    id: "task-1",
                    title: "Collect access review attachment",
                    status: "todo",
                    priority: "high",
                    dueAt: null,
                    blockingReason: "Missing policy attachment",
                },
            ],
            scopesInView: ["Operations Readiness"],
        });

        const result = validatePageModel(pageModel);

        expect(result.ok).toBe(true);
        if (!result.ok) {
            throw new Error("Expected page model to validate");
        }
        expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it("rejects unknown top-level keys", () => {
        const result = validatePageModel({
            meta: {
                title: "Work",
                breadcrumbs: [{ label: "Dashboard" }],
                scope: { scopeId: "all" },
            },
            view: { key: "work_overview" },
            sections: [],
            capabilities: {},
            actions: { available: [] },
            debugDump: true,
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "UNKNOWN_TOP_LEVEL_KEY",
        });
    });

    it("rejects raw-document payload fields inside sections", () => {
        const result = validatePageModel({
            meta: {
                title: "Work",
                breadcrumbs: [{ label: "Dashboard" }],
                scope: { scopeId: "all" },
            },
            view: { key: "work_overview" },
            sections: [
                {
                    key: "danger",
                    kind: "document",
                    items: [
                        {
                            kind: "artifact",
                            id: "doc-1",
                            rawMarkdown: "# full document",
                        },
                    ],
                },
            ],
            capabilities: {},
            actions: { available: [] },
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "INVALID_SHAPE",
        });
    });

    it("sets soft-limit reason when payload is large but valid", () => {
        const largeTitle = "x".repeat(PAYLOAD_SOFT_LIMIT_BYTES + 2000);
        const pageModel = buildWorkOverviewPageModel({
            lens: { scope: "operations-readiness" },
            metrics: baseMetrics,
            blockingTaskSummaries: [
                {
                    id: "task-1",
                    title: largeTitle,
                    status: "todo",
                    priority: "high",
                    dueAt: null,
                    blockingReason: "Needs attachment mapping",
                },
            ],
            scopesInView: ["Operations Readiness"],
        });

        const result = validatePageModel(pageModel);

        expect(result.ok).toBe(true);
        if (!result.ok) {
            throw new Error("Expected soft-limit payload to still validate");
        }
        expect(result.reason).toContain("soft limit");
    });

    it("rejects payloads above hard limit", () => {
        const veryLargeTitle = "x".repeat(PAYLOAD_HARD_LIMIT_BYTES + 1000);
        const pageModel = buildWorkOverviewPageModel({
            lens: { scope: "operations-readiness" },
            metrics: baseMetrics,
            blockingTaskSummaries: [
                {
                    id: "task-1",
                    title: veryLargeTitle,
                    status: "todo",
                    priority: "high",
                    dueAt: null,
                    blockingReason: "Needs attachment mapping",
                },
            ],
            scopesInView: ["Operations Readiness"],
        });

        const result = validatePageModel(pageModel);

        expect(result).toMatchObject({
            ok: false,
            errorCode: "HARD_LIMIT_EXCEEDED",
        });
    });
});
