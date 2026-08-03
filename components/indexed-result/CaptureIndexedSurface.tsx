"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import type { SourceAnchorStub } from "@/lib/stubs/capture-stubs";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { IndexedAudioPlayer } from "./IndexedAudioPlayer";

function anchorForExtractedValue(
    anchors: SourceAnchorStub[],
    extractedValueId: string,
): SourceAnchorStub | undefined {
    return anchors.find((anchor) => anchor.extractedValueId === extractedValueId);
}

function segmentIsHighlighted(
    segmentId: string,
    anchor: SourceAnchorStub | undefined,
): boolean {
    if (!anchor?.segmentIds?.length) return false;
    return anchor.segmentIds.includes(segmentId);
}

export function CaptureIndexedSurface({
    detail,
    initialExtractedValueId,
}: {
    detail: CaptureDetailReadModel;
    initialExtractedValueId?: string | null;
}) {
    const [activeExtractedId, setActiveExtractedId] = useState<string | null>(
        initialExtractedValueId ?? null,
    );
    const [requestedSeekMs, setRequestedSeekMs] = useState<number | null>(null);
    const [timingsOpen, setTimingsOpen] = useState(false);

    const activeAnchor = useMemo(
        () =>
            activeExtractedId
                ? anchorForExtractedValue(
                      detail.sourceAnchors,
                      activeExtractedId,
                  )
                : undefined,
        [activeExtractedId, detail.sourceAnchors],
    );

    const activateExtractedValue = useCallback(
        (extractedValueId: string) => {
            setActiveExtractedId(extractedValueId);
            const anchor = anchorForExtractedValue(
                detail.sourceAnchors,
                extractedValueId,
            );
            if (anchor?.startMs != null) {
                setRequestedSeekMs(anchor.startMs);
            }
        },
        [detail.sourceAnchors],
    );

    useEffect(() => {
        if (initialExtractedValueId) {
            setActiveExtractedId(initialExtractedValueId);
        }
    }, [initialExtractedValueId]);

    const transcriptText =
        detail.voiceLog?.transcriptText ??
        detail.segments.map((segment) => segment.text).join(" ");

    const audioUrl = detail.voiceLog?.audioUri ?? null;

    return (
        <div className="space-y-6 py-4">
            {audioUrl && (
                <section className={cn(SURFACE_CLASS, "p-4")}>
                    <IndexedAudioPlayer
                        audioUrl={audioUrl}
                        requestedSeekMs={requestedSeekMs}
                        onSeekHandled={() => setRequestedSeekMs(null)}
                    />
                </section>
            )}

            <section className={cn(SURFACE_CLASS, "p-4 space-y-3")}>
                <h2 className="text-sm font-medium text-muted-foreground">
                    Transcript
                </h2>
                <p className="text-sm leading-7 text-foreground/85">
                    {transcriptText || "No transcript"}
                </p>
                {activeAnchor?.quote && (
                    <p className="text-xs text-muted-foreground">
                        Highlighted:{" "}
                        <mark className="rounded-sm bg-primary/10 px-1">
                            {activeAnchor.quote}
                        </mark>
                    </p>
                )}

                {detail.segments.length > 0 && (
                    <Collapsible open={timingsOpen} onOpenChange={setTimingsOpen}>
                        <CollapsibleTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronDown
                                    className={cn(
                                        "size-4 transition-transform",
                                        timingsOpen && "rotate-180",
                                    )}
                                />
                                Timings ({detail.segments.length})
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1.5">
                            {detail.segments.map((segment) => {
                                const highlighted = segmentIsHighlighted(
                                    segment.id,
                                    activeAnchor,
                                );
                                return (
                                    <div
                                        key={segment.id}
                                        className={cn(
                                            "rounded-md border-l-2 pl-2 text-xs",
                                            highlighted
                                                ? "border-primary bg-primary/5"
                                                : "border-border/60",
                                        )}
                                    >
                                        <span className="text-muted-foreground">
                                            {Math.round(segment.startMs / 1000)}s
                                        </span>
                                        <span className="ml-2 text-foreground/80">
                                            {segment.text}
                                        </span>
                                    </div>
                                );
                            })}
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </section>

            <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                    Extracted values
                </h2>
                {detail.extractedValues.map((value) => {
                    const isActive = activeExtractedId === value.id;
                    const anchor = anchorForExtractedValue(
                        detail.sourceAnchors,
                        value.id,
                    );
                    return (
                        <button
                            key={value.id}
                            type="button"
                            onClick={() => activateExtractedValue(value.id)}
                            className={cn(
                                SURFACE_CLASS,
                                "w-full p-3 text-left text-sm transition-colors hover:bg-accent/40",
                                isActive && "ring-2 ring-primary",
                            )}
                        >
                            <p className="font-medium">{value.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {value.objectType} · {value.reviewState} ·{" "}
                                {Math.round(value.confidence * 100)}%
                            </p>
                            {anchor?.quote && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {anchor.quote}
                                </p>
                            )}
                        </button>
                    );
                })}
            </section>
        </div>
    );
}

export function ExtractedValueReviewActions({
    extractedValueId,
    reviewState,
    onUpdated,
}: {
    extractedValueId: string;
    reviewState: string;
    onUpdated?: (state: string) => void;
}) {
    const [pending, setPending] = useState(false);
    const [localState, setLocalState] = useState(reviewState);

    const submitReview = async (nextState: "confirmed" | "rejected") => {
        setPending(true);
        try {
            const response = await fetch("/api/extracted-values/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    extractedValueId,
                    reviewState: nextState,
                }),
            });
            if (!response.ok) {
                throw new Error("Review update failed");
            }
            setLocalState(nextState);
            onUpdated?.(nextState);
        } catch (error) {
            console.error(error);
        } finally {
            setPending(false);
        }
    };

    if (localState !== "pending") {
        return (
            <p className="text-xs text-muted-foreground">
                Review state: {localState}
            </p>
        );
    }

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => void submitReview("confirmed")}
            >
                Confirm
            </Button>
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => void submitReview("rejected")}
            >
                Reject
            </Button>
        </div>
    );
}
