"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { TimelineEventDetailReadModel } from "@/lib/data-source/timeline-read-model";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import {
    CapturePreviewLink,
    CaptureTranscriptPreview,
    ExtractedValueReviewActions,
} from "@/components/indexed-result";
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
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import { LAYER_CLASS } from "@/lib/ui/layering";
import { cn } from "@/lib/utils";

function TimelineDetailBody({
    detail,
    captureDetail,
}: {
    detail: TimelineEventDetailReadModel;
    captureDetail?: CaptureDetailReadModel | null;
}) {
    const captureHref = detail.event.captureId
        ? detail.event.extractedValueId
            ? `/captures/${detail.event.captureId}?anchor=${detail.event.extractedValueId}`
            : `/captures/${detail.event.captureId}`
        : null;

    return (
        <div className="space-y-4">
            {detail.event.summary && (
                <p className="text-sm text-muted-foreground">
                    {detail.event.summary}
                </p>
            )}

            {detail.extractedValue && (
                <section className="space-y-2">
                    <h3 className="text-sm font-medium">Extracted fields</h3>
                    <pre className="max-h-48 overflow-auto rounded-lg bg-background p-3 text-xs">
                        {JSON.stringify(detail.extractedValue.fields, null, 2)}
                    </pre>
                    <ExtractedValueReviewActions
                        extractedValueId={detail.extractedValue.id}
                        reviewState={detail.extractedValue.reviewState}
                    />
                </section>
            )}

            {captureDetail && (
                <section className="space-y-2">
                    <h3 className="text-sm font-medium">Capture preview</h3>
                    <CaptureTranscriptPreview
                        detail={captureDetail}
                        highlightExtractedValueId={detail.event.extractedValueId}
                    />
                    {captureHref && (
                        <CapturePreviewLink
                            captureId={detail.event.captureId!}
                            extractedValueId={detail.event.extractedValueId}
                            label="Open full capture"
                        />
                    )}
                </section>
            )}

            {captureHref && !captureDetail && (
                <Link
                    href={captureHref}
                    className="text-sm font-medium text-primary hover:underline"
                >
                    Open capture detail
                </Link>
            )}
        </div>
    );
}

export function TimelineDetailPanel({
    detail,
    captureDetail,
    onClose,
}: {
    detail: TimelineEventDetailReadModel | null;
    captureDetail?: CaptureDetailReadModel | null;
    onClose: () => void;
}) {
    const isMobile = useIsMobileViewport();
    const open = Boolean(detail);

    if (!detail) {
        return null;
    }

    const eventTypeLabel = detail.event.type.replace(/_/g, " ");

    if (isMobile) {
        return (
            <Drawer
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) onClose();
                }}
                direction="bottom"
            >
                <DrawerContent
                    className={cn(
                        "flex h-[90vh] flex-col p-0 overscroll-y-contain",
                        LAYER_CLASS.detailPanel,
                    )}
                >
                    <DrawerHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border/70 p-4 text-left">
                        <div className="min-w-0 space-y-1">
                            <DrawerDescription className="text-xs uppercase tracking-wide">
                                {eventTypeLabel}
                            </DrawerDescription>
                            <DrawerTitle className="text-lg font-semibold">
                                {detail.event.title}
                            </DrawerTitle>
                        </div>
                        <DrawerClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </DrawerHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <TimelineDetailBody
                            detail={detail}
                            captureDetail={captureDetail}
                        />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) onClose();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "flex max-h-[min(85dvh,800px)] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl",
                    LAYER_CLASS.detailPanel,
                )}
            >
                <DialogHeader className="shrink-0 space-y-0 border-b border-border/70 p-4 text-left">
                    <DialogDescription className="text-xs uppercase tracking-wide">
                        {eventTypeLabel}
                    </DialogDescription>
                    <div className="flex items-start justify-between gap-3">
                        <DialogTitle className="text-lg font-semibold">
                            {detail.event.title}
                        </DialogTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <TimelineDetailBody
                        detail={detail}
                        captureDetail={captureDetail}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
