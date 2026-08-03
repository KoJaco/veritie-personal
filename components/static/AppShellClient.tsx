"use client";

import { type ReactNode } from "react";
import { AppShell } from "./AppShell";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";

interface AppShellClientProps {
    children: ReactNode;
}

export function AppShellClient({ children }: AppShellClientProps) {
    return (
        <AppShell>
            <ContextPayloadSlot payload={null} source="layout" />
            {children}
        </AppShell>
    );
}
