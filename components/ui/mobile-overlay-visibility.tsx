"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useSyncExternalStore,
    type ReactNode,
} from "react";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";

type MobileOverlayVisibilityStore = {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => boolean;
    register: () => () => void;
};

function createMobileOverlayVisibilityStore(): MobileOverlayVisibilityStore {
    let openCount = 0;
    const listeners = new Set<() => void>();

    const notify = () => {
        for (const listener of listeners) {
            listener();
        }
    };

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSnapshot() {
            return openCount > 0;
        },
        register() {
            openCount += 1;
            notify();
            return () => {
                openCount = Math.max(0, openCount - 1);
                notify();
            };
        },
    };
}

const MobileOverlayVisibilityContext =
    createContext<MobileOverlayVisibilityStore | null>(null);

export function MobileOverlayVisibilityProvider({
    children,
}: {
    children: ReactNode;
}) {
    const storeRef = useRef<MobileOverlayVisibilityStore | null>(null);
    if (!storeRef.current) {
        storeRef.current = createMobileOverlayVisibilityStore();
    }

    return (
        <MobileOverlayVisibilityContext.Provider value={storeRef.current}>
            {children}
        </MobileOverlayVisibilityContext.Provider>
    );
}

export function useMobileOverlayOpen(): boolean {
    const store = useContext(MobileOverlayVisibilityContext);
    return useSyncExternalStore(
        store?.subscribe ?? (() => () => {}),
        () => store?.getSnapshot() ?? false,
        () => false,
    );
}

export function useRegisterMobileOverlay(open: boolean) {
    const store = useContext(MobileOverlayVisibilityContext);
    const isMobile = useIsMobileViewport();

    useEffect(() => {
        if (!store || !isMobile || !open) {
            return;
        }

        return store.register();
    }, [store, isMobile, open]);
}

export function useMobileOverlayVisibility() {
    const store = useContext(MobileOverlayVisibilityContext);
    const isMobileOverlayOpen = useMobileOverlayOpen();

    const registerMobileOverlay = useCallback(() => {
        if (!store) {
            return () => {};
        }
        return store.register();
    }, [store]);

    return {
        isMobileOverlayOpen,
        registerMobileOverlay,
    };
}
