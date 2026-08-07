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

    const rows = Object.entries(attributes).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
    );

    if (rows.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">No extracted fields.</p>
        );
    }

    return (
        <dl
            className={cn(
                SURFACE_CLASS,
                "grid gap-2 p-3 text-sm",
                className,
            )}
        >
            {rows.map(([key, value]) => {
                const isActivatable = Boolean(onFieldActivate);
                const isActive = activeFieldKey === key;
                const displayValue = isPrimitiveArtifactValue(value)
                    ? formatPrimitiveValue(value)
                    : JSON.stringify(value);
                const quoteHint =
                    key === "source_quote" && typeof value === "string"
                        ? value.trim() || null
                        : null;

                return (
                    <div
                        key={key}
                        className="grid gap-0.5 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-3"
                    >
                        <dt className="font-medium text-muted-foreground">
                            {formatArtifactKey(key, glossaryLabels)}
                        </dt>
                        <dd className="text-foreground">
                            {isActivatable ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onFieldActivate?.(key, quoteHint)
                                    }
                                    className={cn(
                                        "rounded-sm text-left transition-colors",
                                        "hover:text-primary hover:underline underline-offset-2",
                                        isActive &&
                                            "bg-primary/10 px-1 font-medium text-primary underline decoration-primary/40",
                                    )}
                                >
                                    {displayValue}
                                </button>
                            ) : (
                                displayValue
                            )}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}
