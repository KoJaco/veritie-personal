export function formatShortDate(value: string): string {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export function formatRelativeDate(value: string): string {
    const target = new Date(value);
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor(
        (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
            Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())) /
            msPerDay,
    );

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;

    const months = Math.floor(diffDays / 30);
    if (months === 1) return "1 month ago";
    if (months < 12) return `${months} months ago`;

    const years = Math.floor(months / 12);
    return years === 1 ? "1 year ago" : `${years} years ago`;
}
