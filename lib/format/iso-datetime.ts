const ISO_DATE_LIKE_PATTERN =
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** True when a string looks like an ISO 8601 date or date-time and parses cleanly. */
export function isDateLike(value: unknown): boolean {
    if (typeof value !== "string") {
        return false;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 64) {
        return false;
    }

    if (!ISO_DATE_LIKE_PATTERN.test(trimmed)) {
        return false;
    }

    return !Number.isNaN(Date.parse(trimmed));
}

function hasIsoTimeComponent(value: string): boolean {
    return /T\d{2}:\d{2}/.test(value);
}

export type FormatLocaleDateTimeOptions = {
    locale?: string | string[];
    timeZone?: string;
};

/** Format ISO date-like strings for display in the user's locale. */
export function formatLocaleDateTime(
    value: string,
    options?: FormatLocaleDateTimeOptions,
): string {
    const trimmed = value.trim();
    if (!isDateLike(trimmed)) {
        return value;
    }

    const date = new Date(trimmed);
    const { locale, timeZone } = options ?? {};

    if (hasIsoTimeComponent(trimmed)) {
        return date.toLocaleString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            // timeZoneName: "short",
            timeZone,
        });
    }

    return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone,
    });
}
