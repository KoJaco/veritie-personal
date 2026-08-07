"use client";

import { type ReactNode } from "react";
import { AspectThemeSync } from "@/components/lens/AspectThemeSync";
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
                <AspectThemeSync />
                <ContextPayloadSlot payload={null} source="layout" />
                {children}
            </AppShell>
        </CapturesLiveProvider>
    );
}
