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
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export function TimelineDetailPanel({
    detail,
    captureDetail,
    onClose,
}: {
    detail: TimelineEventDetailReadModel | null;
    captureDetail?: CaptureDetailReadModel | null;
    onClose: () => void;
}) {
    if (!detail) return null;

    const captureHref = detail.event.captureId
        ? detail.event.extractedValueId
            ? `/captures/${detail.event.captureId}?anchor=${detail.event.extractedValueId}`
            : `/captures/${detail.event.captureId}`
        : null;

    return (
        <>
            <button
                type="button"
                aria-label="Close timeline detail"
                className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[1px]"
                onClick={onClose}
            />
            <aside
                className={cn(
                    SURFACE_CLASS,
                    "fixed inset-y-0 right-0 z-[100] flex w-full max-w-xl flex-col border-l shadow-2xl bg-card",

                )}
            >
                <div className="flex items-start justify-between gap-3 border-b border-border/70 p-4">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {detail.event.type.replace(/_/g, " ")}
                        </p>
                        <h2 className="text-lg font-semibold">{detail.event.title}</h2>
                    </div>
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

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {detail.event.summary && (
                        <p className="text-sm text-muted-foreground">
                            {detail.event.summary}
                        </p>
                    )}

                    {detail.extractedValue && (
                        <section className="space-y-2">
                            <h3 className="text-sm font-medium">Extracted fields</h3>
                            <pre className="max-h-48 overflow-auto rounded-lg bg-background p-3 text-xs">
                                {JSON.stringify(
                                    detail.extractedValue.fields,
                                    null,
                                    2,
                                )}
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
                                highlightExtractedValueId={
                                    detail.event.extractedValueId
                                }
                            />
                            {captureHref && (
                                <CapturePreviewLink
                                    captureId={detail.event.captureId!}
                                    extractedValueId={
                                        detail.event.extractedValueId
                                    }
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
            </aside>
        </>
    );
}
