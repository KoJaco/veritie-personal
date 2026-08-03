"use client";

import { Suspense, useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
    formatLensLabel,
    scopeBadgeClass,
    scopeKeyFromLens,
    getLensFromSearchParams,
    normalizeLens,
    SCOPE_DEFINITIONS,
    type ScopeLens,
    withLens,
} from "@/lib/lens";
import { cn } from "@/lib/utils";

function ScopeSelector({
    draft,
    setDraft,
}: {
    draft: ScopeLens;
    setDraft: (draft: ScopeLens) => void;
}) {
    return (
        <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Aspect
            </p>
            <div className="grid gap-3">
                <Button
                    type="button"
                    variant={draft.scope === "all" ? "default" : "outline"}
                    className="h-auto justify-start rounded-xl px-4 py-3 text-left"
                    onClick={() => setDraft(normalizeLens({ scope: "all" }))}
                >
                    <div>
                        <div className="font-semibold">All aspects</div>
                        <p className="mt-1 text-xs opacity-70">
                            Cross-surface view of timeline, tasks, records, and resources.
                        </p>
                    </div>
                </Button>
                {SCOPE_DEFINITIONS.map((scope) => (
                    <Button
                        key={scope.id}
                        type="button"
                        variant={draft.scope === scope.id ? "default" : "outline"}
                        className="h-auto justify-start rounded-xl px-4 py-3 text-left"
                        onClick={() => setDraft(normalizeLens({ scope: scope.id }))}
                    >
                        <div>
                            <div className="font-semibold">{scope.label}</div>
                            <p className="mt-1 text-xs opacity-70">
                                {scope.description}
                            </p>
                        </div>
                    </Button>
                ))}
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
    const badgeKey = scopeKeyFromLens(lens);
    const prefetchHrefs = useMemo(() => buildLensPrefetchHrefs(draft), [draft]);

    const apply = () => {
        router.replace(withLens(currentHref, draft));
        setOpen(false);
    };

    const content = (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active scope</span>
                <Badge
                    variant="outline"
                    className={cn(badgeKey ? scopeBadgeClass(badgeKey) : undefined)}
                >
                    {formatLensLabel(lens)}
                </Badge>
            </div>
            <ScopeSelector draft={draft} setDraft={setDraft} />
            <div className="flex justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button type="button" onClick={apply}>
                    Apply scope
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
                        <DrawerTitle>Choose scope</DrawerTitle>
                        <DrawerDescription>
                            Select the global operating scope for the current work surfaces.
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
                    <DialogTitle>Choose scope</DialogTitle>
                    <DialogDescription>
                        Select the global operating scope for the current work surfaces.
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
                <span>Scope</span>
                {badgeKey ? (
                    <Badge
                        variant="outline"
                        className={cn("hidden sm:inline-flex", scopeBadgeClass(badgeKey))}
                    >
                        {formatLensLabel(lens)}
                    </Badge>
                ) : null}
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
