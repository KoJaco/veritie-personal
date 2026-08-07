"use client";

import {
    formatArtifactKey,
    formatPrimitiveValue,
    isPrimitiveArtifactValue,
} from "@/lib/artifact-display";
import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";
import { flattenExtractedValueAttributes } from "@/lib/capture/flatten-extracted-value";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

const HIDDEN_INLINE_FIELD_KEYS = new Set(["aspect", "title", "source_quote"]);

function formatFieldValue(value: unknown): string {
    if (isPrimitiveArtifactValue(value)) {
        return formatPrimitiveValue(value);
    }
    return JSON.stringify(value);
}

function FieldValue({
    fieldKey,
    label,
    value,
    isActivatable,
    isActive,
    onFieldActivate,
    quoteHint,
}: {
    fieldKey: string;
    label: string;
    value: unknown;
    isActivatable: boolean;
    isActive: boolean;
    onFieldActivate?: (fieldKey: string, quote: string | null) => void;
    quoteHint: string | null;
}) {
    const displayValue = formatFieldValue(value);

    return (
        <span className="inline-flex items-baseline gap-1">
            <span className="font-medium text-primary">{label}:</span>
            {isActivatable ? (
                <button
                    type="button"
                    onClick={() => onFieldActivate?.(fieldKey, quoteHint)}
                    className={cn(
                        "rounded-sm text-left text-foreground transition-colors",
                        "hover:text-primary hover:underline underline-offset-2",
                        isActive &&
                        "bg-primary/10 px-1 font-medium text-primary underline decoration-primary/40",
                    )}
                >
                    {displayValue}
                </button>
            ) : (
                <span className="text-primary/75">{displayValue}</span>
            )}
        </span>
    );
}

export function ExtractedValueFieldsList({
    extractedValue,
    glossaryLabels,
    className,
    onFieldActivate,
    activeFieldKey,
}: {
    extractedValue: ExtractedValueStub;
    glossaryLabels?: Record<string, string>;
    className?: string;
    onFieldActivate?: (fieldKey: string, quote: string | null) => void;
    activeFieldKey?: string | null;
}) {
    const attributes = flattenExtractedValueAttributes(extractedValue);

    const sourceQuote =
        typeof attributes.source_quote === "string"
            ? attributes.source_quote.trim()
            : "";

    const inlineRows = Object.entries(attributes).filter(
        ([key, value]) =>
            !HIDDEN_INLINE_FIELD_KEYS.has(key) &&
            value !== undefined &&
            value !== null &&
            value !== "",
    );

    if (inlineRows.length === 0 && !sourceQuote) {
        return (
            <p className="text-sm text-muted-foreground">No extracted fields.</p>
        );
    }

    const isActivatable = Boolean(onFieldActivate);

    return (
        <div className={cn("space-y-3 text-sm", className)}>
            {inlineRows.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {inlineRows.map(([key, value], index) => (
                        <div
                            key={key}
                            className="flex flex-col sm:flex-row items-center sm:gap-3"
                        >
                            {index > 0 && (
                                <span
                                    aria-hidden
                                    className="size-1 shrink-0 rounded-full bg-muted-foreground/45 invisible sm:visible"
                                />
                            )}
                            <FieldValue
                                fieldKey={key}
                                label={formatArtifactKey(key, glossaryLabels)}
                                value={value}
                                isActivatable={isActivatable}
                                isActive={activeFieldKey === key}
                                onFieldActivate={onFieldActivate}
                                quoteHint={null}
                            />
                        </div>
                    ))}
                </div>
            )}

            {sourceQuote && (
                <figure className="border-l-2 border-border/80 pl-3">
                    {isActivatable ? (
                        <button
                            type="button"
                            onClick={() =>
                                onFieldActivate?.("source_quote", sourceQuote)
                            }
                            className={cn(
                                "w-full rounded-sm text-left text-sm leading-relaxed text-muted-foreground transition-colors",
                                "hover:text-foreground",
                                activeFieldKey === "source_quote" &&
                                "bg-primary/5 px-1 text-foreground",
                            )}
                        >
                            <blockquote className="italic">
                                &ldquo;{sourceQuote}&rdquo;
                            </blockquote>
                        </button>
                    ) : (
                        <blockquote className="text-sm italic leading-relaxed text-muted-foreground">
                            &ldquo;{sourceQuote}&rdquo;
                        </blockquote>
                    )}
                </figure>
            )}
        </div>
    );
}
