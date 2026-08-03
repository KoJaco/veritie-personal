import { create } from "zustand";
import type { RailContextPayload } from "./types";
import { logger } from "@/lib/logging/client-logger";

interface ContextPayloadState {
    contextPayload: RailContextPayload | null;
    setContextPayload: (payload: RailContextPayload | null) => void;
}

export const useContextPayloadStore = create<ContextPayloadState>((set) => ({
    contextPayload: null,
    setContextPayload: (payload) => {
        logger.debug("[rail] payload_store_set", {
            scope: payload?.scope ?? null,
            primaryObject: payload?.primaryObject ?? null,
            isNull: payload === null,
        });
        set({ contextPayload: payload });
    },
}));
