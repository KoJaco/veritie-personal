"use client";

import { logger } from "@/lib/logging/client-logger";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ContextRailState = "CLOSED" | "OPEN_OVERLAY" | "PINNED_DOCKED";

interface ContextRailContextType {
    state: ContextRailState;
    setState: (state: ContextRailState) => void;
    open: () => void;
    close: () => void;
    toggle: () => void;
    pin: () => void;
    unpin: () => void;
    isHydrated: boolean;
}

const ContextRailContext = createContext<ContextRailContextType | undefined>(
    undefined
);

export function useContextRail() {
    const context = useContext(ContextRailContext);
    if (!context) {
        throw new Error("useTaskContext must be used within TaskContextProvider");
    }
    return context;
}

interface ContextRailProviderProps {
    children: ReactNode;
}

// Valid TaskContextState values for validation
const VALID_STATES: readonly ContextRailState[] = [
    "CLOSED",
    "OPEN_OVERLAY",
    "PINNED_DOCKED",
] as const;

// Validate that a string is a valid TaskContextState
function isValidState(value: string | null): value is ContextRailState {
    return value !== null && VALID_STATES.includes(value as ContextRailState);
}

// Safely read from sessionStorage with validation
function readPersistedState(): ContextRailState | null {
    if (typeof window === "undefined") return null;
    try {
        const persisted = sessionStorage.getItem("taskContextState");
        if (persisted && isValidState(persisted)) {
            return persisted;
        }
        // Invalid or missing value - clear it
        if (persisted) {
            try {
                sessionStorage.removeItem("taskContextState");
            } catch {
                // Ignore errors when cleaning up invalid state
            }
        }
        return null;
    } catch (error) {
        // sessionStorage unavailable (private browsing, quota exceeded, etc.)
        logger.error("[rail] failed to read persisted state", { error });
        return null;
    }
}

// Safely write to sessionStorage
function writePersistedState(value: ContextRailState): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem("taskContextState", value);
    } catch (error) {
        // sessionStorage unavailable or quota exceeded - fail silently
        // User preference won't persist, but app continues to work
        logger.error("[rail] failed to write persisted state", { error });
    }
}

// Safely remove from sessionStorage
function removePersistedState(): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.removeItem("taskContextState");
    } catch (error) {
        // sessionStorage unavailable - fail silently
        logger.error("[rail] failed to remove persisted state", { error });
    }
}

export function ContextRailProvider({ children }: ContextRailProviderProps) {
    // Always start with CLOSED to match SSR (hydration err without this)
    const [state, setState] = useState<ContextRailState>("CLOSED");
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate state from sessionStorage after mount (client-side only)
    useEffect(() => {
        const persisted = readPersistedState();
        if (persisted) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrating from sessionStorage after SSR
            setState(persisted);
        }
        setIsHydrated(true);
    }, []);

    // Persist PINNED_DOCKED state across navigation
    useEffect(() => {
        if (state === "PINNED_DOCKED") {
            writePersistedState("PINNED_DOCKED");
        }
        // Don't remove sessionStorage when CLOSED - preserve pinned preference
        // Only remove when explicitly unpinning
    }, [state]);

    // Auto-convert PINNED_DOCKED → OPEN_OVERLAY when viewport shrinks below lg (1024px)
    useEffect(() => {
        const handleResize = () => {
            if (state === "PINNED_DOCKED" && window.innerWidth < 1024) {
                setState("OPEN_OVERLAY");
                removePersistedState();
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [state]);

    const open = () => {
        // On mobile, always open as OPEN_OVERLAY (drawer), ignore PINNED_DOCKED preference
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setState("OPEN_OVERLAY");
            return;
        }
        // Desktop: respect persisted PINNED_DOCKED preference
        const persisted = readPersistedState();
        if (persisted === "PINNED_DOCKED") {
            setState("PINNED_DOCKED");
        } else {
            setState("OPEN_OVERLAY");
        }
    };

    const close = () => {
        // Don't remove sessionStorage when closing - preserve pinned preference
        // Only remove when explicitly unpinning
        setState("CLOSED");
    };

    const toggle = () => {
        if (state === "CLOSED") {
            open();
        } else {
            close();
        }
    };

    const pin = () => {
        setState("PINNED_DOCKED");
        writePersistedState("PINNED_DOCKED");
    };

    const unpin = () => {
        setState("OPEN_OVERLAY");
        removePersistedState();
    };

    return (
        <ContextRailContext.Provider
            value={{
                state,
                setState,
                open,
                close,
                toggle,
                pin,
                unpin,
                isHydrated,
            }}
        >
            {children}
        </ContextRailContext.Provider>
    );
}

