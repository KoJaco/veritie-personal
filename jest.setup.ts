/**
 * Jest setup file
 *
 * Runs before each test file. Used to configure testing library
 * and set up global test utilities.
 */

import "@testing-library/jest-dom";

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
