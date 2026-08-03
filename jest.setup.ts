/**
 * Jest setup file
 *
 * Runs before each test file. Used to configure testing library
 * and set up global test utilities.
 */

import "@testing-library/jest-dom";

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
