import {
    DEFAULT_AUTH_REDIRECT,
    sanitizeRedirectPath,
} from "@/lib/auth/safe-redirect";

describe("sanitizeRedirectPath", () => {
    it("returns fallback for empty or unsafe values", () => {
        expect(sanitizeRedirectPath(null)).toBe(DEFAULT_AUTH_REDIRECT);
        expect(sanitizeRedirectPath("")).toBe(DEFAULT_AUTH_REDIRECT);
        expect(sanitizeRedirectPath("https://evil.com")).toBe(
            DEFAULT_AUTH_REDIRECT,
        );
        expect(sanitizeRedirectPath("//evil.com")).toBe(DEFAULT_AUTH_REDIRECT);
        expect(sanitizeRedirectPath("/\\evil")).toBe(DEFAULT_AUTH_REDIRECT);
        expect(sanitizeRedirectPath("/%2F%2Fevil.com")).toBe(
            DEFAULT_AUTH_REDIRECT,
        );
    });

    it("accepts same-origin app paths", () => {
        expect(sanitizeRedirectPath("/timeline")).toBe("/timeline");
        expect(sanitizeRedirectPath("/captures")).toBe("/captures");
        expect(sanitizeRedirectPath("/tasks/abc")).toBe("/tasks/abc");
    });

    it("uses custom fallback when provided", () => {
        expect(sanitizeRedirectPath(null, "/captures")).toBe("/captures");
    });
});
