"use client";

import Link from "next/link";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export function CaptureTranscriptPreview({
    detail,
    highlightExtractedValueId,
    maxTranscriptChars = 280,
    maxExtractedValues = 3,
}: {
    detail: CaptureDetailReadModel;
    highlightExtractedValueId?: string;
    maxTranscriptChars?: number;
    maxExtractedValues?: number;
}) {
    const transcriptText =
        detail.voiceLog?.transcriptText ??
        detail.segments.map((s) => s.text).join(" ");
    const preview =
        transcriptText.length > maxTranscriptChars
            ? `${transcriptText.slice(0, maxTranscriptChars).trim()}…`
            : transcriptText;

    const extractedPreview = detail.extractedValues.slice(0, maxExtractedValues);

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
            {preview ? (
                <p className="text-sm leading-relaxed text-foreground/85">
                    {preview}
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">No transcript</p>
            )}
            {extractedPreview.length > 0 && (
                <ul className="space-y-1.5">
                    {extractedPreview.map((value) => (
                        <li
                            key={value.id}
                            className={cn(
                                "rounded-md border border-border/60 px-2 py-1.5 text-xs",
                                highlightExtractedValueId === value.id &&
                                    "border-primary bg-primary/5",
                            )}
                        >
                            <span className="font-medium">{value.title}</span>
                            <span className="text-muted-foreground">
                                {" "}
                                · {value.objectType}
                            </span>
                        </li>
                    ))}
                </ul>
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
            className="inline-flex text-sm font-medium text-primary hover:underline"
        >
            {label}
        </Link>
    );
}
