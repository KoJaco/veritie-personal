"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "capture_launcher_tucked";

export function usePersistedCaptureLauncherTucked() {
    const [isTucked, setIsTuckedState] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        try {
            setIsTuckedState(localStorage.getItem(STORAGE_KEY) === "1");
        } catch {
            // ignore storage errors
        }
        setIsHydrated(true);
    }, []);

    const setIsTucked = useCallback((value: boolean) => {
        setIsTuckedState(value);
        try {
            localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
        } catch {
            // ignore storage errors
        }
    }, []);

    return { isTucked, setIsTucked, isHydrated };
}
