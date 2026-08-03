import { validatePageModel } from "@/lib/page-model";
import { buildTimelineRouteContract } from "@/app/(app)/timeline/_page-model/build";
import {
    PAYLOAD_HARD_LIMIT_BYTES,
    PAYLOAD_SOFT_LIMIT_BYTES,
} from "@/lib/contracts/validation";

const baseTimelineIndex = {
    items: [
        {
            id: "timeline_event_1",
            type: "task_detected" as const,
            title: "Call Medibank about the claim",
            summary: "Detected from morning voice log",
            aspect: "admin" as const,
            occurredAt: "2026-08-01T08:22:30.000Z",
            captureId: "capture_seed_morning_log",
            extractedValueId: "extracted_task_medibank",
            extractedObjectType: "task" as const,
            reviewState: "pending" as const,
            confidence: 0.86,
        },
    ],
    total: 1,
};

describe("validatePageModel", () => {
    it("accepts a valid minimal timeline page model", () => {
        const { pageModel } = buildTimelineRouteContract({
            lens: { scope: "finance" },
            timelineIndex: baseTimelineIndex,
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
                title: "Timeline",
                breadcrumbs: [{ label: "Timeline" }],
                aspect: { aspectId: "all" },
            },
            view: { key: "timeline_index" },
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
                title: "Timeline",
                breadcrumbs: [{ label: "Timeline" }],
                aspect: { aspectId: "all" },
            },
            view: { key: "timeline_index" },
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
        const { pageModel } = buildTimelineRouteContract({
            lens: { scope: "finance" },
            timelineIndex: {
                items: [
                    {
                        ...baseTimelineIndex.items[0],
                        title: largeTitle,
                    },
                ],
                total: 1,
            },
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
        const { pageModel } = buildTimelineRouteContract({
            lens: { scope: "finance" },
            timelineIndex: {
                items: [
                    {
                        ...baseTimelineIndex.items[0],
                        title: veryLargeTitle,
                    },
                ],
                total: 1,
            },
        });

        const result = validatePageModel(pageModel);

        expect(result).toMatchObject({
            ok: false,
            errorCode: "HARD_LIMIT_EXCEEDED",
        });
    });
});
