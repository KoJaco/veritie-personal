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
}: {
    extractedValue: ExtractedValueStub;
    glossaryLabels?: Record<string, string>;
    className?: string;
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
            {rows.map(([key, value]) => (
                <div
                    key={key}
                    className="grid gap-0.5 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-3"
                >
                    <dt className="font-medium text-muted-foreground">
                        {formatArtifactKey(key, glossaryLabels)}
                    </dt>
                    <dd className="text-foreground">
                        {isPrimitiveArtifactValue(value)
                            ? formatPrimitiveValue(value)
                            : JSON.stringify(value)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
