const DEFAULT_REDIRECT = "/timeline";

function decodeRedirectInput(input: string): string {
    try {
        return decodeURIComponent(input);
    } catch {
        return input;
    }
}

function isUnsafeRedirectPath(path: string): boolean {
    if (!path.startsWith("/")) {
        return true;
    }

    if (path.startsWith("//") || path.includes("\\")) {
        return true;
    }

    if (path.includes("://")) {
        return true;
    }

  // Reject encoded protocol smuggling (e.g. /%2F%2Fevil.com)
    const decoded = decodeRedirectInput(path);
    if (decoded.startsWith("//") || decoded.includes("://") || decoded.includes("\\")) {
        return true;
    }

    return false;
}

/**
 * Returns a same-origin path suitable for post-auth redirects.
 * Rejects open redirects and protocol-relative URLs.
 */
export function sanitizeRedirectPath(
    input: string | null | undefined,
    fallback = DEFAULT_REDIRECT,
): string {
    if (!input) {
        return fallback;
    }

    const trimmed = input.trim();
    if (!trimmed || isUnsafeRedirectPath(trimmed)) {
        return fallback;
    }

    return trimmed;
}

export const DEFAULT_AUTH_REDIRECT = DEFAULT_REDIRECT;
