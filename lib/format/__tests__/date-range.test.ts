import {
    matchesCalendarDateRange,
    parseCalendarDateParam,
    toCalendarDateString,
} from "@/lib/format/date-range";

describe("date-range helpers", () => {
    it("parses valid calendar date params", () => {
        expect(parseCalendarDateParam("2026-08-07")).toBe("2026-08-07");
        expect(parseCalendarDateParam("2026-13-01")).toBeUndefined();
        expect(parseCalendarDateParam("bad")).toBeUndefined();
    });

    it("matches inclusive local calendar ranges", () => {
        const middayLocal = new Date(2026, 7, 7, 12, 0, 0).toISOString();

        expect(
            matchesCalendarDateRange(middayLocal, "2026-08-07", "2026-08-07"),
        ).toBe(true);
        expect(
            matchesCalendarDateRange(
                new Date(2026, 7, 6, 12, 0, 0).toISOString(),
                "2026-08-07",
                "2026-08-07",
            ),
        ).toBe(false);
    });

    it("round-trips calendar date strings", () => {
        const date = new Date(2026, 7, 7);
        expect(toCalendarDateString(date)).toBe("2026-08-07");
    });
});
