import { getLocalDateKey } from "@/lib/format/local-calendar-date";

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseCalendarDateParam(
    value: string | undefined,
): string | undefined {
    if (!value || !CALENDAR_DATE_PATTERN.test(value)) {
        return undefined;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return undefined;
    }

    return value;
}

export function toCalendarDateString(value?: Date): string | undefined {
    if (!value) {
        return undefined;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function parseCalendarDate(value?: string): Date | undefined {
    const normalized = parseCalendarDateParam(value);
    if (!normalized) {
        return undefined;
    }

    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function matchesCalendarDateRange(
    isoTimestamp: string,
    startDate?: string,
    endDate?: string,
): boolean {
    const key = getLocalDateKey(isoTimestamp);

    if (startDate && key < startDate) {
        return false;
    }

    if (endDate && key > endDate) {
        return false;
    }

    return true;
}
