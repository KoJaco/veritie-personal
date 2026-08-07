"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import type { TimelineEventDetailReadModel } from "@/lib/data-source/timeline-read-model";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import type { ReviewState } from "@/lib/domain/extraction";
import {
    CapturePreviewLink,
    CaptureTranscriptPreview,
    ExtractedValueReviewActions,
} from "@/components/indexed-result";
import { ExtractedValueEditorTrigger } from "@/components/extraction/ExtractedValueEditorSheet";
import { ExtractedValueFieldsList } from "@/components/extraction/ExtractedValueFieldsList";
import { parseExtractedValueId } from "@/lib/capture/extracted-value-path";
import { flattenExtractedValueAttributes } from "@/lib/capture/flatten-extracted-value";
import { resolveExtractedFieldQuote } from "@/lib/capture/resolve-extracted-field-quote";
import { Badge } from "@/components/ui/badge";
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
import { TimelineDetailBodySkeleton } from "./TimelineDetailBodySkeleton";

function TimelineDetailHeaderBadges({
    aspect,
    eventType,
    reviewState,
}: {
    aspect: TimelineIndexItem["aspect"];
    eventType: TimelineIndexItem["type"];
    reviewState?: ReviewState;
}) {
    return (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] uppercase">
                {aspect}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase">
                {eventType.replace(/_/g, " ")}
            </Badge>
            {reviewState && (
                <Badge variant="outline" className="text-[10px]">
                    {reviewState}
                </Badge>
            )}
        </div>
    );
}

function TimelineDetailBody({
    selectedItem,
    loadedDetail,
    captureDetail,
    glossaryLabels,
    isLoading,
    error,
    onReviewUpdated,
    onDetailRefresh,
}: {
    selectedItem: TimelineIndexItem;
    loadedDetail: TimelineEventDetailReadModel | null;
    captureDetail?: CaptureDetailReadModel | null;
    glossaryLabels?: Record<string, string>;
    isLoading: boolean;
    error?: string | null;
    onReviewUpdated?: (nextState: ReviewState) => void;
    onDetailRefresh?: () => void;
}) {
    const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
    const [activeHighlightQuote, setActiveHighlightQuote] = useState<
        string | null
    >(null);

    useEffect(() => {
        setActiveFieldKey(null);
        setActiveHighlightQuote(null);
    }, [selectedItem.id, loadedDetail?.event.id]);

    if (error) {
        return <p className="text-sm text-destructive">{error}</p>;
    }

    if (isLoading || !loadedDetail) {
        return <TimelineDetailBodySkeleton />;
    }

    const captureHref = loadedDetail.event.captureId
        ? loadedDetail.event.extractedValueId
            ? `/captures/${loadedDetail.event.captureId}?anchor=${loadedDetail.event.extractedValueId}`
            : `/captures/${loadedDetail.event.captureId}`
        : selectedItem.captureId
          ? selectedItem.extractedValueId
              ? `/captures/${selectedItem.captureId}?anchor=${selectedItem.extractedValueId}`
              : `/captures/${selectedItem.captureId}`
          : null;

    const parsedId = loadedDetail.extractedValue
        ? parseExtractedValueId(loadedDetail.extractedValue.id)
        : null;
    const canEdit =
        loadedDetail.extractedValue &&
        parsedId &&
        (loadedDetail.extractedValue.reviewState === "pending" ||
            loadedDetail.extractedValue.reviewState === "rejected" ||
            loadedDetail.extractedValue.reviewState === "edited");

    const summary =
        loadedDetail.event.summary ?? selectedItem.summary ?? undefined;

    const extractedValueId =
        loadedDetail.event.extractedValueId ?? selectedItem.extractedValueId;

    const handleFieldActivate = (
        fieldKey: string,
        quoteHint: string | null,
    ) => {
        if (!loadedDetail.extractedValue) {
            return;
        }

        const attributes = flattenExtractedValueAttributes(
            loadedDetail.extractedValue,
        );
        const fieldValue = attributes[fieldKey];
        const quote =
            resolveExtractedFieldQuote({
                fieldKey,
                fieldValue,
                captureDetail,
                extractedValueId,
            }) ?? quoteHint;

        if (activeFieldKey === fieldKey) {
            setActiveFieldKey(null);
            setActiveHighlightQuote(null);
            return;
        }

        setActiveFieldKey(fieldKey);
        setActiveHighlightQuote(quote);
    };

    return (
        <div className="space-y-4">
            {summary && (
                <p className="text-sm text-muted-foreground">{summary}</p>
            )}

            {captureDetail && (
                <section className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium">Capture preview</h3>
                        {captureHref && (
                            <CapturePreviewLink
                                captureId={
                                    loadedDetail.event.captureId ??
                                    selectedItem.captureId!
                                }
                                extractedValueId={
                                    loadedDetail.event.extractedValueId ??
                                    selectedItem.extractedValueId
                                }
                                label="Open full capture"
                            />
                        )}
                    </div>
                    <CaptureTranscriptPreview
                        detail={captureDetail}
                        activeHighlightQuote={activeHighlightQuote}
                    />
                </section>
            )}

            {loadedDetail.extractedValue && (
                <section className="space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-row">
                        <h3 className="text-sm font-medium">Extracted fields</h3>
                        <div className="flex place-self-end self-end ml-auto">
                            {canEdit && parsedId && (
                                <ExtractedValueEditorTrigger
                                    extractedValue={loadedDetail.extractedValue}
                                    listKey={parsedId.listKey}
                                    index={parsedId.index}
                                    glossaryLabels={glossaryLabels}
                                    variant="labeled"
                                    onSaved={() => onDetailRefresh?.()}
                                />
                            )}
                        </div>
                    </div>
                    <ExtractedValueFieldsList
                        extractedValue={loadedDetail.extractedValue}
                        glossaryLabels={glossaryLabels}
                        onFieldActivate={handleFieldActivate}
                        activeFieldKey={activeFieldKey}
                    />
                    <div className="flex items-center justify-end">
                        <ExtractedValueReviewActions
                            extractedValueId={loadedDetail.extractedValue.id}
                            reviewState={loadedDetail.extractedValue.reviewState}
                            showEditTrigger={false}
                            extractedValue={loadedDetail.extractedValue}
                            listKey={parsedId?.listKey}
                            index={parsedId?.index}
                            glossaryLabels={glossaryLabels}
                            onUpdated={(nextState) =>
                                onReviewUpdated?.(nextState as ReviewState)
                            }
                        />
                    </div>
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

function TimelineDetailHeaderContent({
    selectedItem,
    reviewState,
}: {
    selectedItem: TimelineIndexItem;
    reviewState?: ReviewState;
}) {
    const eventTypeLabel = selectedItem.type.replace(/_/g, " ");

    return (
        <div className="min-w-0 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {eventTypeLabel}
            </p>
            <p className="text-lg font-semibold capitalize">{selectedItem.title}</p>
            <TimelineDetailHeaderBadges
                aspect={selectedItem.aspect}
                eventType={selectedItem.type}
                reviewState={reviewState}
            />
        </div>
    );
}

export function TimelineDetailPanel({
    selectedItem,
    loadedDetail,
    captureDetail,
    glossaryLabels,
    isLoading,
    error,
    reviewState,
    onReviewUpdated,
    onDetailRefresh,
    onClose,
}: {
    selectedItem: TimelineIndexItem | null;
    loadedDetail: TimelineEventDetailReadModel | null;
    captureDetail?: CaptureDetailReadModel | null;
    glossaryLabels?: Record<string, string>;
    isLoading: boolean;
    error?: string | null;
    reviewState?: ReviewState;
    onReviewUpdated?: (nextState: ReviewState) => void;
    onDetailRefresh?: () => void;
    onClose: () => void;
}) {
    const isMobile = useIsMobileViewport();
    const open = Boolean(selectedItem);

    if (!selectedItem) {
        return null;
    }

    const body = (
        <TimelineDetailBody
            selectedItem={selectedItem}
            loadedDetail={loadedDetail}
            captureDetail={captureDetail}
            glossaryLabels={glossaryLabels}
            isLoading={isLoading}
            error={error}
            onReviewUpdated={onReviewUpdated}
            onDetailRefresh={onDetailRefresh}
        />
    );

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
                        <div className="min-w-0">
                            <DrawerDescription className="sr-only">
                                {selectedItem.type.replace(/_/g, " ")}
                            </DrawerDescription>
                            <DrawerTitle className="sr-only">
                                {selectedItem.title}
                            </DrawerTitle>
                            <TimelineDetailHeaderContent
                                selectedItem={selectedItem}
                                reviewState={reviewState}
                            />
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
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
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
                <DialogHeader className="relative shrink-0 space-y-0 border-b border-border/70 p-3 text-left">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-0 right-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <DialogDescription className="sr-only">
                        {selectedItem.type.replace(/_/g, " ")}
                    </DialogDescription>
                    <DialogTitle className="sr-only">{selectedItem.title}</DialogTitle>
                    <TimelineDetailHeaderContent
                        selectedItem={selectedItem}
                        reviewState={reviewState}
                    />
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">{body}</div>
            </DialogContent>
        </Dialog>
    );
}
