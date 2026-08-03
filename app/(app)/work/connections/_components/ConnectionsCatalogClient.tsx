"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import { formatRelativeDate } from "@/lib/format/date";
import type {
    ConnectionIndexItemReadModel,
    ConnectionProviderOptionReadModel,
    ConnectionsIndexReadModel,
} from "@/lib/data-source";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CircleDashed,
    MoveRight,
    PlugZap,
    Unplug,
} from "lucide-react";

type FlowStep = 1 | 2 | 3 | 4;
type FlowIntent = "connect" | "reconnect";

type ConnectionsCatalogClientProps = Pick<
    ConnectionsIndexReadModel,
    "connected" | "disconnected" | "providerOptions"
>;

export function ConnectionsCatalogClient({
    connected,
    disconnected,
    providerOptions,
}: ConnectionsCatalogClientProps) {
    const [selectedProviderKey, setSelectedProviderKey] = useState(
        providerOptions[0]?.key ?? "",
    );
    const [flowIntent, setFlowIntent] = useState<FlowIntent>("connect");
    const [flowOpen, setFlowOpen] = useState(false);
    const [flowStep, setFlowStep] = useState<FlowStep>(1);

    // derived state during render, fallback as first op
    const activeKey = selectedProviderKey ?? providerOptions[0]?.key;
    const selectedProvider =
        providerOptions.find((provider) => provider.key === activeKey) ??
        providerOptions[0] ??
        null;

    const openFlow = (
        providerKey: string,
        intent: FlowIntent,
        startAtStep: FlowStep = 1,
    ) => {
        setSelectedProviderKey(providerKey);
        setFlowIntent(intent);
        setFlowStep(startAtStep);
        setFlowOpen(true);
    };

    const closeFlow = () => {
        setFlowOpen(false);
        setFlowStep(1);
        setSelectedProviderKey(providerOptions[0]?.key ?? "");
        setFlowIntent("connect");
    };

    const completeFlow = () => {
        toast.success(
            `${selectedProvider?.label ?? "Provider"} ready to connect.`,
            {
                description:
                    "This branch keeps the setup flow guided and non-persistent.",
            },
        );
        closeFlow();
    };

    return (
        <div className="space-y-12">
            <section>
                <div className="space-y-1.5">
                    <h2 className="text-base font-semibold">
                        Connections overview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Scan active providers first, identify anything
                        degraded, and connect new automation sources only when
                        you are ready to bring more trusted state into the workspace.
                    </p>
                </div>
            </section>

            <ConnectionGroupSection
                icon={<PlugZap className="w-4 h-4" />}
                title="Connected"
                description="Providers already feeding trusted state into the workspace."
                items={connected}
                emptyCopy="No active connections yet."
                onConnect={openFlow}
            />

            <ConnectionGroupSection
                icon={<Unplug className="w-4 h-4" />}
                title="Disconnected"
                description="Available providers that are not yet connected."
                items={disconnected}
                emptyCopy="All available providers are already active."
                onConnect={openFlow}
            />

            {selectedProvider ? (
                <ConnectionActionFlow
                    provider={selectedProvider}
                    intent={flowIntent}
                    open={flowOpen}
                    step={flowStep}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeFlow();
                            return;
                        }
                        setFlowOpen(true);
                    }}
                    onStepChange={setFlowStep}
                    onProviderChange={setSelectedProviderKey}
                    onCompleted={completeFlow}
                    availableProviders={providerOptions}
                />
            ) : null}
        </div>
    );
}

export function ConnectionActionFlow({
    provider,
    intent,
    open,
    step,
    onOpenChange,
    onStepChange,
    onProviderChange,
    onCompleted,
    availableProviders,
    trigger,
}: {
    provider: ConnectionProviderOptionReadModel;
    intent: FlowIntent;
    open: boolean;
    step: FlowStep;
    onOpenChange: (open: boolean) => void;
    onStepChange: (step: FlowStep) => void;
    onProviderChange: (providerKey: string) => void;
    onCompleted: () => void;
    availableProviders: ConnectionProviderOptionReadModel[];
    trigger?: React.ReactNode;
}) {
    const isMobile = useIsMobileViewport();

    const content = (
        <AddConnectionFlowBody
            step={step}
            intent={intent}
            providers={availableProviders}
            selectedProvider={provider}
            onSelectProvider={onProviderChange}
            onBack={() => onStepChange(Math.max(step - 1, 1) as FlowStep)}
            onNext={() => onStepChange(Math.min(step + 1, 4) as FlowStep)}
            onComplete={onCompleted}
        />
    );

    return (
        <ResponsiveModal
            isMobile={isMobile}
            open={open}
            onOpenChange={onOpenChange}
            trigger={trigger}
            title={
                intent === "reconnect"
                    ? "Reconnect provider"
                    : "Connect provider"
            }
            description="Complete the guided provider setup flow. Dialogs and drawers stay action-only in this branch."
        >
            {content}
        </ResponsiveModal>
    );
}

function ConnectionGroupSection({
    icon,
    title,
    description,
    items,
    emptyCopy,
    onConnect,
}: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    items: ConnectionIndexItemReadModel[];
    emptyCopy: string;
    onConnect: (
        providerKey: string,
        intent: FlowIntent,
        startAtStep?: FlowStep,
    ) => void;
}) {
    return (
        <section className="space-y-3">
            <div className="space-y-1.5">
                <div className="flex items-center gap-x-1.5">
                    {icon && icon}
                    <h3 className="text-base font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {items.length === 0 ? (
                <div
                    className={cn(
                        SURFACE_CLASS,
                        "p-4 text-sm text-muted-foreground",
                    )}
                >
                    {emptyCopy}
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {items.map((item) => (
                        <article
                            key={item.id}
                            className={cn(SURFACE_CLASS, "p-5 space-y-4")}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-lg font-semibold">
                                            {item.label}
                                        </h4>
                                        <StatusBadge status={item.status} />
                                        <HealthBadge
                                            status={item.healthStatus}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.coverageSummary}
                                    </p>
                                </div>
                                {item.detailHref ? (
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={item.detailHref}>
                                            Open
                                            <MoveRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            onConnect(item.key, "connect", 2)
                                        }
                                    >
                                        {item.actionLabel}
                                        <PlugZap className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <StatPill
                                    variant="nested"
                                    label="Status"
                                    value={formatStatusLabel(item.status)}
                                />
                                <StatPill
                                    variant="nested"
                                    label="Last sync"
                                    value={
                                        item.lastSyncedAt
                                            ? formatRelativeDate(
                                                  item.lastSyncedAt,
                                              )
                                            : "Not synced yet"
                                    }
                                />
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function AddConnectionFlowBody({
    step,
    intent,
    providers,
    selectedProvider,
    onSelectProvider,
    onBack,
    onNext,
    onComplete,
}: {
    step: FlowStep;
    intent: FlowIntent;
    providers: ConnectionProviderOptionReadModel[];
    selectedProvider: ConnectionProviderOptionReadModel;
    onSelectProvider: (providerKey: string) => void;
    onBack: () => void;
    onNext: () => void;
    onComplete: () => void;
}) {
    const stepLabels = [
        "Choose provider",
        "Authenticate",
        "Scope and config",
        "Success",
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {stepLabels.map((label, index) => {
                    const stepNumber = index + 1;
                    const active = stepNumber === step;
                    const complete = stepNumber < step;

                    return (
                        <div
                            key={label}
                            className={cn(
                                "p-3 space-y-1",
                                active
                                    ? "border-primary/50 border bg-primary/5 rounded-xl"
                                    : SURFACE_CLASS,
                            )}
                        >
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Step {stepNumber}
                            </p>
                            <div className="flex items-center gap-2">
                                {complete ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                                )}
                                <p className="text-sm font-medium">{label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {step === 1 ? (
                <div className="flex flex-col gap-3">
                    {providers.map((provider) => {
                        const isSelected =
                            provider.key === selectedProvider.key;

                        return (
                            <button
                                key={provider.key}
                                type="button"
                                className={cn(
                                    "p-3 text-left transition-colors",
                                    isSelected
                                        ? "border-foreground/75 border bg-foreground/5 rounded-xl shadow-lg"
                                        : SURFACE_CLASS,
                                )}
                                onClick={() => onSelectProvider(provider.key)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <p className="font-medium">
                                            {provider.label}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {provider.coverageSummary}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {step === 2 ? (
                <div className={cn(SURFACE_CLASS, "p-4 space-y-4")}>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {intent === "reconnect"
                                ? `Reconnect ${selectedProvider.label}`
                                : `Authenticate ${selectedProvider.label}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Use {formatAuthType(selectedProvider.authType)} to
                            grant read access for the operational automation
                            scopes the workspace needs.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatPill
                            variant="nested"
                            label="Auth type"
                            value={formatAuthType(selectedProvider.authType)}
                        />
                        <StatPill
                            variant="nested"
                            label="Attachment outputs"
                            value={String(
                                selectedProvider.attachmentTypes.length,
                            )}
                        />
                    </div>
                </div>
            ) : null}

            {step === 3 ? (
                <div className={cn(SURFACE_CLASS, "space-y-3 p-4")}>
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">
                            Demo scope and sync preferences
                        </p>
                        <p className="text-sm text-muted-foreground">
                            This remains a guided setup flow only. Inspection
                            content lives on the detail page.
                        </p>
                    </div>
                    {selectedProvider.recommendedScopes.map((scope) => (
                        <div
                            key={scope}
                            className={cn(
                                SURFACE_CLASS_NESTED,
                                "flex items-center justify-between gap-1.5 p-3",
                            )}
                        >
                            <div>
                                <p className="font-medium">{scope}</p>
                                <p className="text-sm text-muted-foreground">
                                    Included in the recommended demo automation
                                    set.
                                </p>
                            </div>
                            <Badge variant="secondary">Recommended</Badge>
                        </div>
                    ))}
                </div>
            ) : null}

            {step === 4 ? (
                <div className={cn(SURFACE_CLASS, "p-5 space-y-3")}>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p className="font-medium">
                            {selectedProvider.label} is ready for guided
                            onboarding
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        The workspace will use this connection to refresh attachment data like{" "}
                        {selectedProvider.attachmentTypes.join(", ")}.
                    </p>
                </div>
            ) : null}

            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={step === 1}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                {step < 4 ? (
                    <Button type="button" onClick={onNext}>
                        {step === 3 ? "Review success" : "Continue"}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="button" onClick={onComplete}>
                        Finish
                        <CheckCircle2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

function ResponsiveModal({
    isMobile,
    open,
    onOpenChange,
    title,
    description,
    trigger,
    children,
}: {
    isMobile: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    trigger?: React.ReactNode;
    children: React.ReactNode;
}) {
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                {trigger ? (
                    <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                ) : null}
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
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

function StatPill({
    label,
    value,
    variant = "default",
}: {
    label: string;
    value: string;
    variant?: "default" | "nested";
}) {
    return (
        <div
            className={cn(
                variant === "nested" ? SURFACE_CLASS_NESTED : SURFACE_CLASS,
                "p-3 space-y-1",
            )}
        >
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {label}
            </p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

function StatusBadge({
    status,
}: {
    status: ConnectionIndexItemReadModel["status"];
}) {
    const className =
        status === "connected"
            ? "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
            : status === "error" || status === "revoked"
              ? "border-rose-300/70 text-rose-700 dark:text-rose-400"
              : "border-border text-muted-foreground";

    return (
        <Badge variant="outline" className={className}>
            {formatStatusLabel(status)}
        </Badge>
    );
}

function HealthBadge({
    status,
}: {
    status: ConnectionIndexItemReadModel["healthStatus"];
}) {
    const className =
        status === "healthy"
            ? "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
            : status === "warning"
              ? "border-amber-300/70 text-amber-700 dark:text-amber-400"
              : status === "error"
                ? "border-rose-300/70 text-rose-700 dark:text-rose-400"
                : "border-border text-muted-foreground";

    return (
        <Badge variant="outline" className={className}>
            {status}
        </Badge>
    );
}

function formatStatusLabel(value: ConnectionIndexItemReadModel["status"]) {
    return value.replace("_", " ");
}

function formatAuthType(value: ConnectionProviderOptionReadModel["authType"]) {
    return value.replace("_", " ");
}
