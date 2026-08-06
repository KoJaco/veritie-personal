/**
 * Jest setup file
 *
 * Runs before each test file. Used to configure testing library
 * and set up global test utilities.
 */

import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";

if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (!globalThis.TextDecoder) {
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
if (!globalThis.ReadableStream) {
    globalThis.ReadableStream =
        ReadableStream as typeof globalThis.ReadableStream;
}

if (!("Request" in globalThis)) {
    class MockRequest {
        url: string;
        constructor(url: string) {
            this.url = url;
        }
    }
    (globalThis as { Request?: unknown }).Request = MockRequest;
}

if (!("Response" in globalThis)) {
    class MockResponse {
        status: number;
        headers: Headers;
        private payload: unknown;
        private rawBody: string;

        constructor(body?: BodyInit | null, init?: ResponseInit) {
            this.status = init?.status ?? 200;
            this.headers = new Headers(init?.headers);
            this.rawBody = typeof body === "string" ? body : "";
            if (typeof body === "string") {
                try {
                    this.payload = JSON.parse(body);
                } catch {
                    this.payload = body;
                }
            } else {
                this.payload = body;
            }
        }

        async json() {
            return this.payload;
        }

        async text() {
            return this.rawBody;
        }

        async arrayBuffer() {
            const buffer = Buffer.from(this.rawBody, "utf8");
            return buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength,
            );
        }
    }

    (globalThis as { Response?: unknown }).Response = MockResponse;
}

if (
    typeof globalThis.Response !== "undefined" &&
    typeof globalThis.Response.json !== "function"
) {
    const BaseResponse = globalThis.Response;
    globalThis.Response = class extends BaseResponse {
        static json(data: unknown, init?: ResponseInit): Response {
            const headers = new Headers(init?.headers);
            if (!headers.has("content-type")) {
                headers.set("content-type", "application/json");
            }
            return new BaseResponse(JSON.stringify(data), {
                ...init,
                headers,
            });
        }
    } as typeof Response;
}

// Canvas mock for waveform components in jsdom
if (typeof HTMLCanvasElement !== "undefined") {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        roundRect: jest.fn(),
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        transform: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        rect: jest.fn(),
        clip: jest.fn(),
        createLinearGradient: jest.fn(() => ({
            addColorStop: jest.fn(),
        })),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            pathname: "/",
            query: {},
            asPath: "/",
        };
    },
    usePathname() {
        return "/";
    },
    useSearchParams() {
        return new URLSearchParams();
    },
}));

// Suppress console errors/warnings in tests unless needed (uncomment this to see all console output during tests)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};
