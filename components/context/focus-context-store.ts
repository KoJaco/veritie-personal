import { create } from "zustand";
import type { FocusContext } from "./types";
import { logger } from "@/lib/logging/client-logger";

interface FocusContextState {
    focusContext: FocusContext | null;
    setFocusContext: (next: FocusContext | null) => void;
    clearFocusContext: () => void;
}

export const useFocusContextStore = create<FocusContextState>((set) => ({
    focusContext: null,
    setFocusContext: (next) => {
        logger.debug("[focus] context_set", {
            hasEntityPointer: Boolean(next?.entityPointer),
            hasSubviewPointer: Boolean(next?.subviewPointer),
            intent: next?.intent ?? null,
            isNull: next === null,
        });
        set({ focusContext: next });
    },
    clearFocusContext: () => {
        logger.debug("[focus] context_cleared");
        set({ focusContext: null });
    },
}));
