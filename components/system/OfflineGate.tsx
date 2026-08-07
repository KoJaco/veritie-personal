"use client";

import { useEffect, useState } from "react";

import { OfflineScreen } from "@/components/system/OfflineScreen";

export function OfflineGate({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        updateOnlineStatus();
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);

        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
        };
    }, []);

    if (!isOnline) {
        return <OfflineScreen />;
    }

    return children;
}
