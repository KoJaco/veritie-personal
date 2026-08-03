import { captureFlowLog } from "@/lib/capture/capture-flow-logger";

export type ScreenWakeLockHandle = {
    release: () => Promise<void>;
};

export function isScreenWakeLockSupported(): boolean {
    return (
        typeof navigator !== "undefined" &&
        "wakeLock" in navigator &&
        typeof navigator.wakeLock?.request === "function"
    );
}

export async function acquireScreenWakeLock(): Promise<ScreenWakeLockHandle | null> {
    if (!isScreenWakeLockSupported()) {
        return null;
    }

    try {
        const sentinel = await navigator.wakeLock.request("screen");
        captureFlowLog.info("wake_lock.acquired");

        return {
            release: async () => {
                if (sentinel.released) {
                    return;
                }

                try {
                    await sentinel.release();
                    captureFlowLog.info("wake_lock.released");
                } catch (error) {
                    captureFlowLog.warn("wake_lock.release_failed", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                }
            },
        };
    } catch (error) {
        captureFlowLog.warn("wake_lock.acquire_failed", {
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
