"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import { cn } from "@/lib/utils";

export function TimelineEventRow({
    item,
    selected,
    onSelect,
}: {
    item: TimelineIndexItem;
    selected?: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
                "w-full rounded-xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:bg-accent/40",
                selected && "ring-2 ring-primary",
            )}
        >
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                    {item.type.replace(/_/g, " ")}
                </Badge>
                <Badge variant="secondary" className="text-[10px] uppercase">
                    {item.aspect}
                </Badge>
                {item.reviewState && (
                    <Badge variant="outline" className="text-[10px]">
                        {item.reviewState}
                    </Badge>
                )}
                {item.captureId && (
                    <Link
                        href={`/captures/${item.captureId}`}
                        className="text-[10px] font-medium text-primary underline-offset-2 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                    >
                        View capture
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
                {new Date(item.occurredAt).toLocaleString()}
                {item.confidence != null && (
                    <span className="ml-2">
                        {Math.round(item.confidence * 100)}% confidence
                    </span>
                )}
            </p>
        </button>
    );
}
