import {
    buildCoverageModel,
    daysBetweenInclusive,
    percentIntoWindow,
} from "../model";

describe("scope coverage model", () => {
    it("builds sorted gaps, segments, and totals deterministically", () => {
        const model = buildCoverageModel("2026-01-01", "2026-01-10", [
            {
                start: "2026-01-05",
                end: "2026-01-06",
                days: 2,
                checkIds: ["chk_do_mfa_enforcement", "chk_do_log_retention"],
            },
            {
                start: "2026-01-02",
                end: "2026-01-03",
                days: 2,
                checkIds: ["chk_do_log_retention", "chk_do_service_continuity"],
            },
        ]);

        expect(model.windowDays).toBe(10);
        expect(model.gaps.map((g) => g.key)).toEqual([
            "2026-01-02__2026-01-03",
            "2026-01-05__2026-01-06",
        ]);
        expect(model.totals).toEqual({
            totalGapDays: 4,
            longestGapDays: 2,
            checksImpactedCount: 3,
        });

        expect(model.segments).toHaveLength(5);
        expect(model.segments[0]).toMatchObject({
            type: "covered",
            start: "2026-01-01",
            end: "2026-01-01",
            days: 1,
        });
        expect(model.segments[1]).toMatchObject({
            type: "gap",
            start: "2026-01-02",
            end: "2026-01-03",
        });
        expect(model.segments[2]).toMatchObject({
            type: "covered",
            start: "2026-01-04",
            end: "2026-01-04",
            days: 1,
        });
        expect(model.segments[3]).toMatchObject({
            type: "gap",
            start: "2026-01-05",
            end: "2026-01-06",
        });
        expect(model.segments[4]).toMatchObject({
            type: "covered",
            start: "2026-01-07",
            end: "2026-01-10",
            days: 4,
        });
    });

    it("computes inclusive day windows", () => {
        expect(daysBetweenInclusive("2026-02-01", "2026-02-01")).toBe(1);
        expect(daysBetweenInclusive("2026-02-01", "2026-02-10")).toBe(10);
    });

    it("maps dates into bounded timeline percentages", () => {
        expect(percentIntoWindow("2026-01-01", "2026-01-01", 10)).toBe(0);
        expect(percentIntoWindow("2026-01-10", "2026-01-01", 10)).toBe(100);
        expect(percentIntoWindow("2025-12-30", "2026-01-01", 10)).toBe(0);
        expect(percentIntoWindow("2026-01-20", "2026-01-01", 10)).toBe(100);
    });

    it("creates a single covered segment when no gaps exist", () => {
        const model = buildCoverageModel("2026-03-01", "2026-03-05", []);
        expect(model.totals.totalGapDays).toBe(0);
        expect(model.segments).toEqual([
            {
                type: "covered",
                start: "2026-03-01",
                end: "2026-03-05",
                days: 5,
            },
        ]);
    });

    it("handles gaps at window boundaries", () => {
        const model = buildCoverageModel("2026-01-01", "2026-01-10", [
            {
                start: "2026-01-01",
                end: "2026-01-02",
                days: 2,
                checkIds: ["chk_do_mfa_enforcement"],
            },
            {
                start: "2026-01-09",
                end: "2026-01-10",
                days: 2,
                checkIds: ["chk_do_log_retention"],
            },
        ]);

        expect(model.segments[0]).toMatchObject({
            type: "gap",
            start: "2026-01-01",
            end: "2026-01-02",
        });
        expect(model.segments[1]).toMatchObject({
            type: "covered",
            start: "2026-01-03",
            end: "2026-01-08",
        });
        expect(model.segments[2]).toMatchObject({
            type: "gap",
            start: "2026-01-09",
            end: "2026-01-10",
        });
    });

    it("supports single-day windows", () => {
        const model = buildCoverageModel("2026-04-01", "2026-04-01", []);
        expect(model.windowDays).toBe(1);
        expect(percentIntoWindow("2026-04-01", "2026-04-01", 1)).toBe(0);
        expect(model.segments).toHaveLength(1);
        expect(model.segments[0]).toMatchObject({
            type: "covered",
            start: "2026-04-01",
            end: "2026-04-01",
            days: 1,
        });
    });

    it("preserves overlapping gaps as provided entries", () => {
        const model = buildCoverageModel("2026-05-01", "2026-05-10", [
            {
                start: "2026-05-03",
                end: "2026-05-06",
                days: 4,
                checkIds: ["chk_do_mfa_enforcement"],
            },
            {
                start: "2026-05-05",
                end: "2026-05-07",
                days: 3,
                checkIds: ["chk_do_log_retention"],
            },
        ]);

        expect(model.gaps).toHaveLength(2);
        const gapSegments = model.segments.filter((segment) => segment.type === "gap");
        expect(gapSegments).toHaveLength(2);
    });
});
