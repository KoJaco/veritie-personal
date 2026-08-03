"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import type {
    ConnectionDetailReadModel,
    ConnectionProviderOptionReadModel,
} from "@/lib/data-source";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ConnectionActionFlow } from "./ConnectionsCatalogClient";
import {
    CheckCircle2,
    PlugZap,
    RefreshCcw,
    ShieldAlert,
    Unplug,
} from "lucide-react";

export function ConnectionDetailActions({
    detail,
    provider,
}: {
    detail: ConnectionDetailReadModel;
    provider: ConnectionProviderOptionReadModel;
}) {
    const isMobile = useIsMobileViewport();
    const [reconnectOpen, setReconnectOpen] = useState(false);
    const [reconnectStep, setReconnectStep] = useState<1 | 2 | 3 | 4>(2);
    const [syncOpen, setSyncOpen] = useState(false);
    const [disconnectOpen, setDisconnectOpen] = useState(false);

    return (
        <>
            {detail.actionAvailability.canSyncNow ? (
                <ResponsiveModal
                    isMobile={isMobile}
                    open={syncOpen}
                    onOpenChange={setSyncOpen}
                    trigger={
                        <Button size="sm" variant="outline">
                            Sync now
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                    }
                    title="Sync now"
                    description="Kick off a demo-only sync run for this provider."
                >
                    <ActionPanel
                        eyebrow="Automation refresh"
                        title={`Refresh ${detail.label} now`}
                        description="Run a demo sync to pull the latest provider state, refresh generated attachments, and surface any provider-side drift before posture review."
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <ActionStat
                                label="Last sync"
                                value={
                                    detail.lastSyncedAt
                                        ? new Date(
                                              detail.lastSyncedAt,
                                          ).toLocaleString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              hour: "numeric",
                                              minute: "2-digit",
                                          })
                                        : "No sync recorded"
                                }
                            />
                            <ActionStat
                                label="Generated attachments"
                                value={String(detail.generatedAttachments.length)}
                            />
                        </div>
                        <div
                            className={cn(
                                SURFACE_CLASS_NESTED,
                                "flex items-start gap-3 p-3",
                            )}
                        >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <p className="text-sm text-muted-foreground">
                                This branch keeps sync execution stub-backed,
                                but the interaction still mirrors the operator
                                action you would take before reviewing attachment
                                freshness.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSyncOpen(false)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setSyncOpen(false)}
                            >
                                Run demo sync
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </ActionPanel>
                </ResponsiveModal>
            ) : null}

            {detail.actionAvailability.canReconnect ? (
                <ConnectionActionFlow
                    provider={provider}
                    intent="reconnect"
                    open={reconnectOpen}
                    step={reconnectStep}
                    onOpenChange={(open) => {
                        setReconnectOpen(open);
                        if (!open) {
                            setReconnectStep(2);
                        }
                    }}
                    onStepChange={setReconnectStep}
                    onProviderChange={() => {}}
                    onCompleted={() => {
                        setReconnectOpen(false);
                        setReconnectStep(2);
                    }}
                    availableProviders={[provider]}
                    trigger={
                        <Button size="sm" variant="outline">
                            Reconnect
                            <PlugZap />
                        </Button>
                    }
                />
            ) : null}

            {detail.actionAvailability.canDisconnect ? (
                <ResponsiveModal
                    isMobile={isMobile}
                    open={disconnectOpen}
                    onOpenChange={setDisconnectOpen}
                    trigger={
                        <Button size="sm" variant="outline">
                            Disconnect
                            <Unplug />
                        </Button>
                    }
                    title="Disconnect provider"
                    description="Disconnecting remains a demo-only action in this branch."
                >
                    <ActionPanel
                        eyebrow="Danger zone"
                        title={`Disconnect ${detail.label}`}
                        description="Disconnecting pauses automated attachment refresh for this provider and shifts affected checks back toward manual upkeep until the integration is restored."
                    >
                        <div
                            className={cn(
                                SURFACE_CLASS_NESTED,
                                "space-y-3 p-3 border-rose-300/40",
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-rose-600" />
                                <p className="text-sm font-medium">
                                    Review the impact before continuing
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">
                                    {detail.automatedChecks} automated checks
                                </Badge>
                                <Badge variant="outline">
                                    {detail.generatedAttachments.length} generated
                                    attachment items
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This is still a demo-only confirmation surface.
                                No destructive mutation is persisted in this
                                branch.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDisconnectOpen(false)}
                            >
                                Keep connected
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setDisconnectOpen(false)}
                            >
                                Confirm disconnect
                                <Unplug className="h-4 w-4" />
                            </Button>
                        </div>
                    </ActionPanel>
                </ResponsiveModal>
            ) : null}
        </>
    );
}

function ResponsiveModal({
    isMobile,
    open,
    onOpenChange,
    trigger,
    title,
    description,
    children,
}: {
    isMobile: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">{children}</div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

function ActionPanel({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className={cn(SURFACE_CLASS, "space-y-2 p-4")}>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {eyebrow}
                </p>
                <div className="space-y-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </div>
    );
}

function ActionStat({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className={cn(SURFACE_CLASS_NESTED, "space-y-1 p-3")}>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {label}
            </p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}
