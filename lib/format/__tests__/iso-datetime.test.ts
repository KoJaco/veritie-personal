import {
    formatLocaleDateTime,
    isDateLike,
} from "@/lib/format/iso-datetime";

describe("iso-datetime", () => {
    describe("isDateLike", () => {
        it("accepts ISO date-time with timezone offset", () => {
            expect(isDateLike("2026-08-14T08:00:00+10:00")).toBe(true);
        });

        it("accepts ISO date-only strings", () => {
            expect(isDateLike("2026-08-14")).toBe(true);
        });

        it("accepts ISO date-time with Z suffix", () => {
            expect(isDateLike("2026-08-14T08:00:00Z")).toBe(true);
        });

        it("rejects arbitrary text", () => {
            expect(isDateLike("remind two hours before")).toBe(false);
        });

        it("rejects numeric and non-string values", () => {
            expect(isDateLike(20260814)).toBe(false);
            expect(isDateLike(null)).toBe(false);
        });

        it("rejects malformed ISO strings", () => {
            expect(isDateLike("2026-13-40")).toBe(false);
            expect(isDateLike("08-14-2026")).toBe(false);
        });
    });

    describe("formatLocaleDateTime", () => {
        it("formats date-time values with locale and timezone", () => {
            const formatted = formatLocaleDateTime("2026-08-14T08:00:00+10:00", {
                locale: "en-AU",
                timeZone: "Australia/Sydney",
            });

            expect(formatted).toContain("2026");
            expect(formatted).toMatch(/Aug|August/i);
            expect(formatted).toMatch(/14/);
            expect(formatted).toMatch(/8:00|08:00/);
        });

        it("formats date-only values without time", () => {
            const formatted = formatLocaleDateTime("2026-08-14", {
                locale: "en-US",
                timeZone: "UTC",
            });

            expect(formatted).toMatch(/Aug/);
            expect(formatted).toMatch(/14/);
            expect(formatted).toMatch(/2026/);
            expect(formatted).not.toMatch(/:/);
        });

        it("returns the original string when not date-like", () => {
            expect(formatLocaleDateTime("not-a-date")).toBe("not-a-date");
        });
    });
});
