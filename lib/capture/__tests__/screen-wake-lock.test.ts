import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
    acquireScreenWakeLock,
    isScreenWakeLockSupported,
} from "@/lib/capture/screen-wake-lock";

describe("lib/capture/screen-wake-lock", () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(global, "navigator", {
            configurable: true,
            value: originalNavigator,
        });
    });

    it("reports unsupported when wakeLock is missing", async () => {
        Object.defineProperty(global, "navigator", {
            configurable: true,
            value: {},
        });

        expect(isScreenWakeLockSupported()).toBe(false);
        await expect(acquireScreenWakeLock()).resolves.toBeNull();
    });

    it("acquires and releases a wake lock", async () => {
        const release = jest.fn(async () => undefined);
        const request = jest.fn(async () => ({
            released: false,
            release,
        }));

        Object.defineProperty(global, "navigator", {
            configurable: true,
            value: {
                wakeLock: { request },
            },
        });

        const handle = await acquireScreenWakeLock();

        expect(request).toHaveBeenCalledWith("screen");
        expect(handle).not.toBeNull();

        await handle?.release();
        expect(release).toHaveBeenCalled();
    });

    it("returns null when acquisition fails", async () => {
        Object.defineProperty(global, "navigator", {
            configurable: true,
            value: {
                wakeLock: {
                    request: jest.fn(async () => {
                        throw new Error("denied");
                    }),
                },
            },
        });

        expect(await acquireScreenWakeLock()).toBeNull();
    });
});
