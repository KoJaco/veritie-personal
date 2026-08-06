"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { captureJobCoordinator } from "@/lib/capture/capture-job-coordinator";

type CaptureLiveContextValue = {
    pendingNewIds: string[];
    lastEnrichedIds: string[];
    clearAnimatedIds: (captureId: string) => void;
};

const CaptureLiveContext = createContext<CaptureLiveContextValue | null>(null);

export function CapturesLiveProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [pendingNewIds, setPendingNewIds] = useState<string[]>([]);
    const [lastEnrichedIds, setLastEnrichedIds] = useState<string[]>([]);

    useEffect(() => {
        return captureJobCoordinator.subscribe((event) => {
            if (event.type === "capture:persisted") {
                setPendingNewIds((current) => [...current, event.captureId]);
                if (pathname === "/captures") {
                    router.refresh();
                }
            }

            if (event.type === "capture:enriched") {
                setLastEnrichedIds((current) => [...current, event.captureId]);
                setPendingNewIds((current) =>
                    current.filter((id) => id !== event.captureId),
                );
                if (pathname === "/captures") {
                    router.refresh();
                } else {
                    toast.success("Capture indexed", {
                        description: "Extraction synced to your captures.",
                    });
                }
            }
        });
    }, [pathname, router]);

    const clearAnimatedIds = useCallback((captureId: string) => {
        setPendingNewIds((current) =>
            current.filter((id) => id !== captureId),
        );
        setLastEnrichedIds((current) =>
            current.filter((id) => id !== captureId),
        );
    }, []);

    const value = useMemo(
        () => ({
            pendingNewIds,
            lastEnrichedIds,
            clearAnimatedIds,
        }),
        [pendingNewIds, lastEnrichedIds, clearAnimatedIds],
    );

    return (
        <CaptureLiveContext.Provider value={value}>
            {children}
        </CaptureLiveContext.Provider>
    );
}

export function useCaptureLiveUpdates(): CaptureLiveContextValue {
    const context = useContext(CaptureLiveContext);
    if (!context) {
        return {
            pendingNewIds: [],
            lastEnrichedIds: [],
            clearAnimatedIds: () => {},
        };
    }
    return context;
}
