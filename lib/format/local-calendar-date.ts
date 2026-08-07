/** Local calendar helpers for grouping/display (not UTC ISO date slices). */

export function getLocalDateKey(occurredAt: string): string {
    const date = new Date(occurredAt);
    if (Number.isNaN(date.getTime())) {
        return occurredAt.slice(0, 10);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function formatLocalDateGroupLabel(
    occurredAt: string,
    locale?: string | string[],
): string {
    const date = new Date(occurredAt);
    if (Number.isNaN(date.getTime())) {
        return occurredAt;
    }

    return date.toLocaleDateString(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}
