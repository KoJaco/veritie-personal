import {
    formatLocalDateGroupLabel,
    getLocalDateKey,
} from "@/lib/format/local-calendar-date";

describe("local-calendar-date", () => {
    const originalTz = process.env.TZ;

    beforeAll(() => {
        process.env.TZ = "Australia/Sydney";
    });

    afterAll(() => {
        process.env.TZ = originalTz;
    });

    it("groups by local calendar date, not UTC slice", () => {
        const occurredAt = "2026-08-07T14:00:00.000Z";
        expect(getLocalDateKey(occurredAt)).toBe("2026-08-08");
        expect(occurredAt.slice(0, 10)).toBe("2026-08-07");
    });

    it("formats readable group labels from local date", () => {
        const label = formatLocalDateGroupLabel(
            "2026-08-07T10:00:00.000Z",
            "en-US",
        );

        expect(label).toMatch(/August/);
        expect(label).toMatch(/7/);
    });
});
