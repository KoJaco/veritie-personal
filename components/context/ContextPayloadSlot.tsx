"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logging/client-logger";
import { useContextPayloadStore } from "./context-payload-store";
import type { RailContextPayload } from "./types";

interface ContextPayloadSlotProps {
    payload: RailContextPayload | null;
    source?: "layout" | "page";
}

export function ContextPayloadSlot({
    payload,
    source = "page",
}: ContextPayloadSlotProps) {
    const setContextPayload = useContextPayloadStore(
        (state) => state.setContextPayload,
    );

    useEffect(() => {
        logger.debug("[rail] payload_slot", {
            source,
            scope: payload?.scope ?? null,
            primaryObject: payload?.primaryObject ?? null,
            isNull: payload === null,
        });

        if (payload === null) {
            // payload === null, we want to explicitly clear
            // Only clear if the payload is actually null to avoid transient re-render.
            setContextPayload(null);
            return;
        }

        // payload !== null, we want to set the payload
        setContextPayload(payload);
    }, [payload, setContextPayload, source]);

    return null;
}
