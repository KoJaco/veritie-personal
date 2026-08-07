"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
            return;
        }

        if (!("serviceWorker" in navigator)) {
            return;
        }

        let cancelled = false;

        async function registerServiceWorker() {
            try {
                const registration = await navigator.serviceWorker.register(
                    "/sw.js",
                    {
                        scope: "/",
                        updateViaCache: "none",
                    },
                );

                if (!cancelled) {
                    await registration.update();
                }
            } catch (error) {
                console.error("Service worker registration failed:", error);
            }
        }

        void registerServiceWorker();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
