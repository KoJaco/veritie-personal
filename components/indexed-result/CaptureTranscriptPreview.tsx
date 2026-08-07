"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import {
    collectTranscriptHighlightRanges,
    renderMultiHighlightedText,
} from "@/lib/evidence-index/quote-highlight";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function buildTranscriptText(detail: CaptureDetailReadModel): string {
    if (detail.voiceLog?.transcriptText?.trim()) {
        return detail.voiceLog.transcriptText.trim();
    }

    return detail.segments
        .map((segment) => segment.text?.trim())
        .filter((text): text is string => Boolean(text))
        .join(" ");
}

export function CaptureTranscriptPreview({
    detail,
    highlightExtractedValueId,
    activeHighlightQuote,
    maxTranscriptChars,
}: {
    detail: CaptureDetailReadModel;
    highlightExtractedValueId?: string;
    /** When provided, only this quote is highlighted (overrides multi-quote mode). */
    activeHighlightQuote?: string | null;
    maxTranscriptChars?: number;
}) {
    const transcriptText = buildTranscriptText(detail);
    const displayText =
        maxTranscriptChars != null && transcriptText.length > maxTranscriptChars
            ? `${transcriptText.slice(0, maxTranscriptChars).trim()}…`
            : transcriptText;

    const segmentTexts = detail.segments
        .map((segment) => segment.text)
        .filter((text): text is string => Boolean(text?.trim()));

    const highlightQuotes = useMemo(() => {
        if (activeHighlightQuote !== undefined) {
            const quote = activeHighlightQuote?.trim();
            return quote ? [{ quote, primary: true }] : [];
        }

        const quotes: Array<{ quote: string; primary?: boolean }> = [];

        for (const anchor of detail.sourceAnchors) {
            const quote = anchor.quote?.trim();
            if (!quote) {
                continue;
            }
            quotes.push({
                quote,
                primary: anchor.extractedValueId === highlightExtractedValueId,
            });
        }

        for (const value of detail.extractedValues) {
            const fields = value.fields as Record<string, unknown> | undefined;
            const sourceQuote =
                typeof fields?.source_quote === "string"
                    ? fields.source_quote.trim()
                    : "";
            if (!sourceQuote) {
                continue;
            }
            const alreadyIncluded = quotes.some((entry) => entry.quote === sourceQuote);
            if (!alreadyIncluded) {
                quotes.push({
                    quote: sourceQuote,
                    primary: value.id === highlightExtractedValueId,
                });
            }
        }

        return quotes;
    }, [
        activeHighlightQuote,
        detail.extractedValues,
        detail.sourceAnchors,
        highlightExtractedValueId,
    ]);

    const highlightRanges = useMemo(
        () =>
            collectTranscriptHighlightRanges(
                displayText,
                highlightQuotes,
                segmentTexts,
            ),
        [displayText, highlightQuotes, segmentTexts],
    );

    const transcriptParts = useMemo(
        () => renderMultiHighlightedText(displayText, highlightRanges),
        [displayText, highlightRanges],
    );

    return (
        <div className={cn(SURFACE_CLASS, "space-y-3 p-3")}>
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Source capture
                </p>
                <p className="mt-1 text-sm font-medium">
                    {detail.capture.title ?? "Voice capture"}
                </p>
            </div>
            {displayText ? (
                <ScrollArea className="max-h-48 w-full">
                    <p className="pr-3 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                        {transcriptParts.map((part, index) =>
                            part.highlighted ? (
                                <mark
                                    key={index}
                                    className={cn(
                                        "rounded-sm px-0.5 underline decoration-2 underline-offset-2",
                                        part.primary
                                            ? "bg-primary/20 font-medium text-foreground decoration-primary/60"
                                            : "bg-primary/10 text-foreground decoration-primary/30",
                                    )}
                                >
                                    {part.text}
                                </mark>
                            ) : (
                                <span key={index}>{part.text}</span>
                            ),
                        )}
                    </p>
                </ScrollArea>
            ) : (
                <p className="text-sm text-muted-foreground">No transcript</p>
            )}
        </div>
    );
}

export function CapturePreviewLink({
    captureId,
    extractedValueId,
    label = "Open full capture",
}: {
    captureId: string;
    extractedValueId?: string;
    label?: string;
}) {
    const href = extractedValueId
        ? `/captures/${captureId}?anchor=${extractedValueId}`
        : `/captures/${captureId}`;

    return (
        <Link
            href={href}
            className="inline-flex text-sm font-medium text-foreground/75 hover:underline hover:text-foreground items-center gap-1.5"
        >
            {label}
            <ArrowRight className="size-4" />
        </Link>
    );
}
