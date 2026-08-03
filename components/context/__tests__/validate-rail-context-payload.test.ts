import { buildRailPayload } from "@/components/context/build-rail-payload";
import { validateRailContextPayload } from "@/components/context/validate-rail-context-payload";
import {
    PAYLOAD_HARD_LIMIT_BYTES,
    PAYLOAD_SOFT_LIMIT_BYTES,
} from "@/lib/contracts/validation";

describe("validateRailContextPayload", () => {
    it("accepts a minimal valid payload", () => {
        const result = validateRailContextPayload({
            scope: { type: "work" },
        });

        expect(result.ok).toBe(true);
        if (!result.ok) {
            throw new Error("Expected validation to pass");
        }
        expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it("accepts lens scope 'all' for work scope", () => {
        const result = validateRailContextPayload({
            scope: { type: "work" },
            data: {
                lens: {
                    scope: "all",
                },
            },
        });

        expect(result.ok).toBe(true);
    });

    it("rejects unknown top-level keys", () => {
        const result = validateRailContextPayload({
            scope: { type: "work" },
            debugDump: true,
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "UNKNOWN_TOP_LEVEL_KEY",
        });
    });

    it("rejects malformed nested shapes", () => {
        const result = validateRailContextPayload({
            scope: { type: "task_detail", id: "task_1" },
            data: {
                snapshot: {
                    blockedChecks: "2",
                    overdueTasks: 1,
                    missingAttachments: 1,
                },
            },
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "INVALID_SHAPE",
        });
    });

    it("rejects raw document fields in nested route context payloads", () => {
        const result = validateRailContextPayload({
            scope: { type: "work" },
            data: {
                snapshot: {
                    blockedChecks: 2,
                    overdueTasks: 1,
                    missingAttachments: 1,
                    rawMarkdown: "# full document blob",
                },
            },
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "INVALID_SHAPE",
        });
    });

    it("rejects non JSON-safe values", () => {
        const result = validateRailContextPayload({
            scope: { type: "work" },
            data: {
                scopesInView: [undefined],
            },
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "NON_JSON_SAFE_VALUE",
        });
    });

    it("rejects circular references deterministically", () => {
        const circularTaskIds: unknown[] = ["task_1"];
        circularTaskIds.push(circularTaskIds);

        const result = validateRailContextPayload({
            scope: { type: "work" },
            data: {
                topBlockingTaskIds: circularTaskIds as string[],
            },
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "SERIALIZATION_FAILED",
        });
    });
});

describe("buildRailPayload budget behavior", () => {
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it("warns and passes when payload exceeds soft limit but remains under hard limit", () => {
        const overSoft = "x".repeat(PAYLOAD_SOFT_LIMIT_BYTES + 2000);

        const payload = buildRailPayload({
            scope: { type: "work" },
            aggregates: {
                scopesInView: [overSoft],
            },
        });

        expect(payload).not.toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            "[rail] payload_soft_limit_exceeded",
            expect.objectContaining({
                softLimitBytes: PAYLOAD_SOFT_LIMIT_BYTES,
            }),
        );
    });

    it("rejects payloads that exceed hard limit", () => {
        const overHard = "x".repeat(PAYLOAD_HARD_LIMIT_BYTES + 1000);

        const payload = buildRailPayload({
            scope: { type: "work" },
            aggregates: {
                scopesInView: [overHard],
            },
        });

        expect(payload).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            "[rail] payload_rejected",
            expect.objectContaining({
                errorCode: "HARD_LIMIT_EXCEEDED",
            }),
        );
    });
});
