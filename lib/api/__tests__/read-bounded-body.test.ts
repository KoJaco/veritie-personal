import { describe, expect, it } from "@jest/globals";

import {
    BoundedBodyError,
    readBoundedJson,
    readBoundedText,
} from "@/lib/api/read-bounded-body";
import {
    createTestJsonRequest,
    createTestRequestWithContentLength,
} from "@/lib/api/test-json-request";

describe("readBoundedText", () => {
    it("returns empty string when body is missing", async () => {
        const request = {
            headers: { get: () => null },
            body: null,
            text: async () => "",
        } as unknown as Request;
        await expect(readBoundedText(request, 64)).resolves.toBe("");
    });

    it("reads valid body within limit", async () => {
        const request = createTestJsonRequest({ ok: true });
        await expect(readBoundedText(request, 64)).resolves.toBe('{"ok":true}');
    });

    it("rejects oversized content-length before reading", async () => {
        const request = createTestRequestWithContentLength(1024);
        await expect(readBoundedText(request, 16)).rejects.toMatchObject({
            status: 413,
        });
    });

    it("rejects body larger than max without trusting content-length", async () => {
        const request = createTestJsonRequest(
            { pad: "x".repeat(32) },
            { contentLength: "8" },
        );
        await expect(readBoundedText(request, 16)).rejects.toBeInstanceOf(
            BoundedBodyError,
        );
    });
});

describe("readBoundedJson", () => {
    it("parses valid JSON", async () => {
        const request = createTestJsonRequest({ a: 1 });
        await expect(readBoundedJson(request, 64)).resolves.toEqual({ a: 1 });
    });

    it("rejects invalid JSON", async () => {
        const request = {
            headers: {
                get: (name: string) => {
                    if (name === "content-length") return "9";
                    return null;
                },
            },
            body: null,
            text: async () => "{not-json",
        } as unknown as Request;

        await expect(readBoundedJson(request, 64)).rejects.toMatchObject({
            status: 400,
        });
    });
});
