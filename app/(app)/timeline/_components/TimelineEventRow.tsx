"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function TimelineEventRow({
    item,
    selected,
    reviewState,
    onSelect,
}: {
    item: TimelineIndexItem;
    selected?: boolean;
    reviewState?: TimelineIndexItem["reviewState"];
    onSelect: (id: string) => void;
}) {
    const displayReviewState = reviewState ?? item.reviewState;
    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
                "w-full rounded-xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:bg-card/70 hover:border-foreground/20 duration-150",
                selected && "ring-2 ring-primary",
            )}
        >
            <div className="flex items-center justify-between gap-1.5">

                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                        {item.aspect}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">
                        {item.type.replace(/_/g, " ")}
                    </Badge>
                    {displayReviewState && (
                        <Badge variant="outline" className="text-[10px]">
                            {displayReviewState}
                        </Badge>
                    )}
                </div>
                {item.captureId && (
                    <Link
                        href={`/captures/${item.captureId}`}
                        className="text-xs font-medium underline-offset-2 hover:underline items-center gap-1.5 flex items-center text-foreground/75 hover:text-foreground"
                        onClick={(event) => event.stopPropagation()}
                    >
                        View capture
                        <ArrowRight className="size-3" />
                    </Link>
                )}
            </div>
            <p className="mt-2 font-medium">{item.title}</p>
            {item.summary && (

                <p className="mt-1 text-sm text-muted-foreground">
                    {item.summary}
                </p>


            )}
            <p className="mt-2 text-xs text-muted-foreground">
                {new Date(item.occurredAt).toLocaleTimeString()}
                {/* {item.confidence != null && (
                    <span className="ml-2">
                        {Math.round(item.confidence * 100)}% confidence
                    </span>
                )} */}
            </p>
        </button>
    );
}
