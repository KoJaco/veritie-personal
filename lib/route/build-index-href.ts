export function buildIndexHref(
    route: string,
    base: Record<string, string | undefined>,
    updates: Record<string, string | undefined> = {},
) {
    const params = new URLSearchParams();
    const merged = { ...base, ...updates };
    for (const [key, value] of Object.entries(merged)) {
        if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${route}?${query}` : route;
}
