/**
 * Jest setup file
 *
 * Runs before each test file. Used to configure testing library
 * and set up global test utilities.
 */

import "@testing-library/jest-dom";

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
