import {
    formatLocalDateGroupLabel,
    getLocalDateKey,
} from "@/lib/format/local-calendar-date";

function dateKeyInTimeZone(occurredAt: string, timeZone: string): string {
    const date = new Date(occurredAt);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return `${year}-${month}-${day}`;
}

describe("local-calendar-date", () => {
    it("local calendar date can differ from UTC ISO date slice", () => {
        const occurredAt = "2026-08-07T14:00:00.000Z";

        expect(occurredAt.slice(0, 10)).toBe("2026-08-07");
        expect(dateKeyInTimeZone(occurredAt, "Australia/Sydney")).toBe(
            "2026-08-08",
        );
    });

    it("getLocalDateKey uses runtime local calendar components", () => {
        const occurredAt = "2026-08-07T14:00:00.000Z";
        const date = new Date(occurredAt);
        const expected = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
        ].join("-");

        expect(getLocalDateKey(occurredAt)).toBe(expected);
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
