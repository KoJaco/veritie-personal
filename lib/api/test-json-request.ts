/**
 * Test helpers for API routes that use readBoundedText/readBoundedJson.
 * Returns Request-shaped objects compatible with jsdom Jest (no stream required).
 */

export function createTestJsonRequest(
    body: unknown,
    options: {
        authorization?: string;
        contentLength?: string;
    } = {},
): never {
    const text = JSON.stringify(body);
    const contentLength =
        options.contentLength ?? String(Buffer.byteLength(text, "utf8"));

    return {
        headers: {
            get: (name: string) => {
                if (name === "content-type") return "application/json";
                if (name === "content-length") return contentLength;
                if (name === "authorization") return options.authorization ?? null;
                return null;
            },
        },
        body: null,
        text: async () => text,
    } as never;
}

export function createTestRequestWithContentLength(contentLength: number): never {
    return {
        headers: {
            get: (name: string) => {
                if (name === "content-length") return String(contentLength);
                return null;
            },
        },
        body: null,
        text: async () => "",
    } as never;
}
