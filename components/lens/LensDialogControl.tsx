"use client";

import { Suspense, useMemo, useState } from "react";
import { ChevronDownIcon, LayoutGrid, SquareCheckBig } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AspectBadge } from "@/components/lens/AspectBadge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import {
    buildLensPrefetchHrefs,
    scopeBadgeClass,
    scopeKeyFromLens,
    getLensFromSearchParams,
    normalizeLens,
    SCOPE_DEFINITIONS,
    type ScopeLens,
    withLens,
} from "@/lib/lens";
import { ASPECT_ICONS } from "@/lib/aspect/aspect-ui";
import { cn } from "@/lib/utils";

function ScopeSelector({
    draft,
    setDraft,
}: {
    draft: ScopeLens;
    setDraft: (draft: ScopeLens) => void;
}) {
    return (
        <section>
            <div className="grid gap-3">
                <Button
                    type="button"
                    variant={draft.scope === "all" ? "default" : "outline"}
                    className="h-auto justify-start rounded-xl px-4 py-3 text-left relative"
                    onClick={() => setDraft(normalizeLens({ scope: "all" }))}
                >
                    <LayoutGrid className="size-5 shrink-0 mt-1 opacity-70 absolute top-1.5 right-3" />
                    <div>
                        <div className="font-semibold">All aspects</div>
                        <p className="mt-1 text-xs opacity-70">
                            Cross-surface view of timeline, tasks, records, and
                            resources.
                        </p>
                    </div>
                </Button>
                {SCOPE_DEFINITIONS.map((scope) => {
                    const Icon = ASPECT_ICONS[scope.id];
                    return (
                        <Button
                            key={scope.id}
                            type="button"
                            variant={draft.scope === scope.id ? "default" : "outline"}
                            className="h-auto justify-start rounded-xl px-4 py-3 text-left relative"
                            onClick={() => setDraft(normalizeLens({ scope: scope.id }))}
                        >
                            <Icon className="mt-0.5 size-5 shrink-0 opacity-70 absolute top-1.5 right-3" />
                            <div className="flex flex-col">
                                <div className="font-semibold">{scope.label}</div>
                                <p className="mt-1 text-xs opacity-70">
                                    {scope.description}
                                </p>
                            </div>
                        </Button>
                    );
                })}
            </div>
        </section>
    );
}

function ScopeLensBody({
    open,
    setOpen,
    lens,
    currentHref,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    lens: ScopeLens;
    currentHref: string;
}) {
    const router = useRouter();
    const isMobile = useIsMobileViewport();
    const [draft, setDraft] = useState<ScopeLens>(normalizeLens(lens));
    const prefetchHrefs = useMemo(() => buildLensPrefetchHrefs(draft), [draft]);

    const apply = () => {
        router.replace(withLens(currentHref, draft));
        setOpen(false);
    };

    const content = (
        <div className="space-y-3">
            <ScopeSelector draft={draft} setDraft={setDraft} />
            <div className="flex justify-end gap-3 mt-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button type="button" onClick={apply}>
                    Apply
                    <SquareCheckBig className="h-4 w-4" />
                </Button>
            </div>
            <div className="hidden" aria-hidden>
                {prefetchHrefs.join(",")}
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className="px-4 pb-6">
                    <DrawerHeader className="px-0">
                        <DrawerTitle>Choose Aspect</DrawerTitle>
                        <DrawerDescription>
                            Select which aspect you want to focus on right now.
                        </DrawerDescription>
                    </DrawerHeader>
                    {content}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Choose Aspect</DialogTitle>
                    <DialogDescription>
                        Select which aspect you want to focus on right now.
                    </DialogDescription>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}

function UrlLensDialogControlInner() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const lens = getLensFromSearchParams(searchParams);
    const [open, setOpen] = useState(false);
    const badgeKey = scopeKeyFromLens(lens);
    const currentSearch = searchParams.toString();
    const currentHref = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => setOpen(true)}
            >
                <span>Aspect</span>
                {badgeKey ? (
                    <AspectBadge
                        aspect={badgeKey}
                        className="hidden sm:inline-flex"
                    />
                ) : (
                    <Badge
                        variant="default"
                        className={cn("hidden sm:inline-flex", scopeBadgeClass(badgeKey))}
                    >
                        All aspects
                    </Badge>
                )}
                <ChevronDownIcon className="h-4 w-4" />
            </Button>
            <ScopeLensBody
                open={open}
                setOpen={setOpen}
                lens={lens}
                currentHref={currentHref}
            />
        </>
    );
}

export function UrlLensDialogControl() {
    return (
        <Suspense fallback={null}>
            <UrlLensDialogControlInner />
        </Suspense>
    );
}
