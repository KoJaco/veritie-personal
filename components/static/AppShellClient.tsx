"use client";

import { type ReactNode } from "react";
import { AppShell } from "./AppShell";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { CapturesLiveProvider } from "@/components/captures/CapturesLiveProvider";

interface AppShellClientProps {
    children: ReactNode;
}

export function AppShellClient({ children }: AppShellClientProps) {
    return (
        <CapturesLiveProvider>
            <AppShell>
                <ContextPayloadSlot payload={null} source="layout" />
                {children}
            </AppShell>
        </CapturesLiveProvider>
    );
}
