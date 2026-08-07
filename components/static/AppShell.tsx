"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "@/components/static/AppHeader";
import { AppSidebarProvider } from "./AppSidebarProvider";
import {
    ContextRailProvider,
    useContextRail,
} from "@/components/context/ContextRailProvider";
import { ContextRail } from "@/components/context/ContextRail";
import { useRailContract } from "@/components/context/client-route-resolver";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import { cn } from "@/lib/utils";
import {
    AppShellPageHeaderProvider,
    AppShellPageHeaderSlot,
    useAppShellPageHeader,
} from "./AppShellPageHeaderProvider";
import { MobileOverlayVisibilityProvider } from "@/components/ui/mobile-overlay-visibility";
import { useIsScrolledFromTop } from "@/lib/hooks/useIsScrolledFromTop";
import { envPublic } from "@/lib/config/env.public";

const GlobalCaptureLauncher = dynamic(
    () =>
        import("@/components/capture/GlobalCaptureLauncher").then(
            (mod) => mod.GlobalCaptureLauncher,
        ),
    { ssr: false },
);

interface AppShellProps {
    children: ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
    const { state, isHydrated, toggle, close } = useContextRail();
    const contract = useRailContract();
    const isMobile = useIsMobileViewport();
    const isScrolled = useIsScrolledFromTop(20);
    const { header } = useAppShellPageHeader();

    // Only apply pinned layout after hydration and on desktop to prevent SSR mismatch
    // On mobile, PINNED_DOCKED state is rendered as drawer, so don't apply pinned layout
    // TODO: could maybe clean these constants up a bit
    const isPinned =
        isHydrated &&
        contract.enabled &&
        !isMobile &&
        state === "PINNED_DOCKED";

    const isOverlay =
        isHydrated && contract.enabled && state === "OPEN_OVERLAY";

    const hasPageHeader = Boolean(header);

    const canRenderRail = contract.enabled;

    useEffect(() => {
        if (!contract.enabled && state !== "CLOSED") {
            // Force-close rail when route disables it.
            close();
        }
    }, [contract.enabled, state, close]);

    return (
        <div className="bg-background">
            {/* Sidebar - Fixed viewport column on desktop */}
            <AppSidebar />

            {/* Main content lane */}
            <div className="2xl:pl-64">
                {/* Header pinned to top while page scrolls */}
                <AppHeader />

                {/* Main content container, including page header and main content element. Min height calculated using height of AppHeader */}
                <div
                    className={cn(
                        "2xl:border-l 2xl:border-t border-t 2xl:rounded-tl-2xl shadow-sm gap-0 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] flex flex-1 flex-col overflow-hidden",
                        isPinned && "lg:pr-96 2xl:pr-111",
                    )}
                >
                    <div className={hasPageHeader ? "lg:px-6 px-4 pt-8" : ""}>
                        <AppShellPageHeaderSlot />
                    </div>

                    {/* Main content expands naturally; document handles overflow */}
                    <main
                        className={cn(
                            "pb-8 lg:px-6 px-4 overflow-x-hidden",
                            hasPageHeader ? "pt-0" : "pt-12",
                        )}
                    >
                        {children}
                    </main>
                </div>
            </div>

            {/* Context rail pinned in viewport on desktop */}
            {isPinned && (
                <div
                    className={cn(
                        "hidden lg:block fixed right-6 bottom-8 lg:w-90 2xl:w-105 z-20 transition-all duration-150",
                        isScrolled ? "top-8" : "top-24",
                    )}
                >
                    <ContextRail isScrolled={isScrolled} />
                </div>
            )}

            {/* Overlay context rail (rendered outside main layout) */}
            {canRenderRail && isOverlay && <ContextRail isScrolled={isScrolled} />}
            {envPublic.captureLauncherEnabled && <GlobalCaptureLauncher />}
        </div>
    );
}

/**
 * AppShell component
 *
 * Establishes the global layout and navigation structure.
 * Per ADR 0001: AppShell provides persistent sidebar navigation and global header.
 *
 * Scroll Contract:
 * - Sidebar: fixed to viewport on desktop
 * - Header: sticky at top during document/page scroll
 * - Main content: expands naturally; browser document handles vertical scroll
 * - Pinned context rail: fixed viewport column on desktop
 */
export function AppShell({ children }: AppShellProps) {
    return (
        <MobileOverlayVisibilityProvider>
            <ContextRailProvider>
                <AppShellPageHeaderProvider>
                    <AppSidebarProvider>
                        <AppShellContent>{children}</AppShellContent>
                    </AppSidebarProvider>
                </AppShellPageHeaderProvider>
            </ContextRailProvider>
        </MobileOverlayVisibilityProvider>
    );
}
