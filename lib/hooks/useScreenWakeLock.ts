import { useCallback, useEffect, useRef } from "react";
import {
    acquireScreenWakeLock,
    type ScreenWakeLockHandle,
} from "@/lib/capture/screen-wake-lock";

/**
 * Keeps the device screen awake while live capture is in progress.
 * Re-acquires after tab visibility returns (browsers release wake locks when hidden).
 */
export function useScreenWakeLock(enabled: boolean): void {
    const handleRef = useRef<ScreenWakeLockHandle | null>(null);
    const enabledRef = useRef(enabled);


    const releaseWakeLock = useCallback(async () => {
        const handle = handleRef.current;
        handleRef.current = null;
        if (!handle) {
            return;
        }

        await handle.release();
    }, []);

    const acquireWakeLock = useCallback(async () => {
        if (!enabledRef.current || handleRef.current) {
            return;
        }

        const handle = await acquireScreenWakeLock();
        if (!handle) {
            return;
        }

        if (!enabledRef.current) {
            await handle.release();
            return;
        }

        handleRef.current = handle;
    }, []);

    useEffect(() => {
        if (!enabled) {
            void releaseWakeLock();
            return;
        }

        void acquireWakeLock();

        const onVisibilityChange = () => {
            if (document.visibilityState !== "visible" || !enabledRef.current) {
                return;
            }

            handleRef.current = null;
            void acquireWakeLock();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            void releaseWakeLock();
        };
    }, [enabled, acquireWakeLock, releaseWakeLock]);
}
