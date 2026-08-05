"use client";

import { useEffect, useRef } from "react";
import { Pin, PinOff, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ContextRailState, useContextRail } from "./ContextRailProvider";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import { useRailContract } from "./client-route-resolver";
import { TAB_COMPONENTS } from "./tabs";
import type { RailTabKey } from "./types";
import { Separator } from "../ui/separator";

function ContextContent({ state }: { state: ContextRailState }) {
    const railContract = useRailContract();

    // Clamp defaultTab to available tabs
    const { tabs, defaultTab, context } = railContract;
    const preferred = defaultTab;
    const actualDefaultTab = tabs.some((t) => t.key === preferred)
        ? preferred
        : (tabs[0]?.key ?? "assistant");

    return (
        <Tabs
            key={railContract.routeId}
            defaultValue={actualDefaultTab as RailTabKey}
            className="h-full flex flex-col"
        >
            <TabsList className="mx-4 shrink-0">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            <Separator className="mt-1 opacity-20" />

            {tabs.map((tab) => {
                const TabComponent = TAB_COMPONENTS[tab.key];
                return (
                    <TabsContent
                        key={tab.key}
                        value={tab.key}
                        // forceMount={tab.key === "assistant"}
                        className="flex-1 min-h-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col overflow-hidden"
                    >
                        <TabComponent context={context} />
                    </TabsContent>
                );
            })}
            {/* spacer for padding */}
            {state !== "PINNED_DOCKED" && <div className="pb-2" />}
        </Tabs>
    );
}

export function ContextRail({ isScrolled = false }: { isScrolled?: boolean }) {
    const { state, close, pin, unpin } = useContextRail();
    const isMobile = useIsMobileViewport();
    const pinnedRailRef = useRef<HTMLDivElement | null>(null);
    const previousIsScrolledRef = useRef(isScrolled);

    // Handle ESC key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && state !== "CLOSED") {
                close();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [state, close]);

    // Preserve bottom anchoring for scrollable rail content while pinned rail height transitions.
    useEffect(() => {
        const wasScrolled = previousIsScrolledRef.current;
        previousIsScrolledRef.current = isScrolled;

        if (state !== "PINNED_DOCKED" || !wasScrolled || isScrolled) {
            return;
        }

        const container = pinnedRailRef.current;
        if (!container) {
            return;
        }

        const scrollTargets = Array.from(
            container.querySelectorAll<HTMLElement>(
                '[data-preserve-bottom-scroll="true"]',
            ),
        );

        if (scrollTargets.length === 0) {
            return;
        }

        const snapToBottom = () => {
            for (const target of scrollTargets) {
                target.scrollTop = target.scrollHeight;
            }
        };

        // AppShell uses transition-all duration-150 on the pinned wrapper.
        // Keep re-snapping during the transition window so the viewport stays anchored.
        const preserveUntil = performance.now() + 220;
        let frame = 0;
        const tick = () => {
            snapToBottom();
            if (performance.now() < preserveUntil) {
                frame = window.requestAnimationFrame(tick);
            }
        };
        tick();

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [isScrolled, state]);

    // In desktop sheet mode, lock document scroll so only rail/page internals scroll.
    useEffect(() => {
        if (isMobile || state !== "OPEN_OVERLAY") {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [isMobile, state]);

    if (isMobile) {
        // On mobile, ignore PINNED_DOCKED state (only open drawer when explicitly OPEN_OVERLAY) ... prevents drawer from auto-opening when switching from desktop with PINNED_DOCKED state
        const drawerOpen = state === "OPEN_OVERLAY";
        return (
            <Drawer
                open={drawerOpen}
                onOpenChange={(open) => !open && close()}
                direction="bottom"
            >
                <DrawerContent className="h-[90vh] p-0 flex flex-col overscroll-y-contain">
                    <DrawerHeader className="flex flex-row items-center justify-between p-4 shrink-0">
                        <DrawerTitle className="text-lg font-semibold">
                            Ask Veritie
                        </DrawerTitle>
                        <DrawerClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={close}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </DrawerHeader>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ContextContent state={state} />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop: overlay or pinned
    if (state === "CLOSED") {
        return null;
    }

    if (state === "PINNED_DOCKED") {
        // Pinned: fixed right column (handled by AppShell layout)
        return (
            <div
                ref={pinnedRailRef}
                className="h-full w-full flex flex-col border bg-background rounded-lg overflow-hidden overscroll-y-contain"
            >
                <div className="flex items-center justify-between p-4 shrink-0">
                    <h2 className="text-sm font-semibold">Ask Veritie</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={unpin}
                            aria-label="Unpin"
                            className="h-8 w-8"
                        >
                            <PinOff className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={close}
                            aria-label="Close"
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                    <ContextContent state={state} />
                </div>
            </div>
        );
    }

    // OPEN_OVERLAY: slides in from right, non-modal
    return (
        <Sheet open={true} onOpenChange={() => { }} modal={true}>
            <SheetContent
                side="right"
                nonModal={true}
                className="lg:w-96 xl:w-[500px] p-0 flex flex-col border-l h-full overflow-hidden overscroll-y-contain"
                onInteractOutside={(e) => {
                    // Prevent closing on outside click
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    close();
                    e.preventDefault();
                }}
            >
                <div className="flex items-center justify-between pt-6 px-4 flex-shrink-0">
                    <h2 className="text-sm font-semibold">Ask Veritie</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={pin}
                            aria-label="Pin"
                            className="h-8 w-8 lg:flex hidden"
                        >
                            <Pin className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={close}
                            aria-label="Close"
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                    <ContextContent state={state} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
