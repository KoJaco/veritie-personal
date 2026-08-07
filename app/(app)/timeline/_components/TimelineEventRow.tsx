"use client";

import { ExpandIcon, Eye, MaximizeIcon } from "lucide-react";
import { AspectBadge } from "@/components/lens/AspectBadge";
import { TypeBadge } from "@/components/extraction/TypeBadge";
import { ExtractedValueFieldsList } from "@/components/extraction/ExtractedValueFieldsList";
import { ExtractedValueInlineReviewActions } from "@/components/extraction/ExtractedValueInlineReviewActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import type { ReviewState } from "@/lib/domain/extraction";
import { resolveTimelineItemObjectType } from "@/lib/extraction/object-type-ui";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

function TimelineEventRowActions({
    item,
    reviewState,
    onSelect,
    onReviewUpdated,
    layout,
}: {
    item: TimelineIndexItem;
    reviewState?: ReviewState;
    onSelect: (id: string) => void;
    onReviewUpdated?: (nextState: ReviewState) => void;
    layout: "desktop" | "mobile";
}) {
    const extractedValueId = item.extractedValueId;
    const displayReviewState = reviewState ?? item.reviewState;

    return (
        <div
            className={cn(
                "flex items-center gap-1.5",
                layout === "mobile" && "mt-2 justify-end",
                layout === "desktop" && "shrink-0",
            )}
            onClick={(event) => event.stopPropagation()}
        >
            {/* <Button
                type="button"
                size="sm"
                variant="link"
                className="gap-1.5 h-7"
                onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item.id);
                }}
            >
                <span>View item</span>
            </Button> */}

            {extractedValueId && displayReviewState && onReviewUpdated && (
                <ExtractedValueInlineReviewActions
                    extractedValueId={extractedValueId}
                    reviewState={displayReviewState}
                    onUpdated={onReviewUpdated}
                    compact
                />
            )}
        </div>
    );
}

export function TimelineEventRow({
    item,
    selected,
    reviewState,
    glossaryLabels,
    onSelect,
    onReviewUpdated,
}: {
    item: TimelineIndexItem;
    selected?: boolean;
    reviewState?: TimelineIndexItem["reviewState"];
    glossaryLabels?: Record<string, string>;
    onSelect: (id: string) => void;
    onReviewUpdated?: (nextState: ReviewState) => void;
}) {
    const displayReviewState = reviewState ?? item.reviewState;
    const objectType = resolveTimelineItemObjectType(item);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(item.id);
                }
            }}
            className={cn(
                "w-full rounded-xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:bg-card/70 hover:border-foreground/20 duration-150 cursor-pointer",
                selected && "ring-2 ring-primary",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <AspectBadge aspect={item.aspect} />
                    {objectType && <TypeBadge objectType={objectType} />}
                    {displayReviewState && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[10px]",
                                displayReviewState === "pending" &&
                                "text-orange-700 dark:text-orange-400",
                            )}
                        >
                            {displayReviewState}
                        </Badge>
                    )}
                </div>

                <div className="hidden md:block">
                    <TimelineEventRowActions
                        item={item}
                        reviewState={displayReviewState}
                        onSelect={onSelect}
                        onReviewUpdated={onReviewUpdated}
                        layout="desktop"
                    />
                </div>
            </div>

            <p className="mt-2 font-medium capitalize">{item.title}</p>

            {item.extractedValue ? (
                <ExtractedValueFieldsList
                    extractedValue={item.extractedValue}
                    glossaryLabels={glossaryLabels}
                    className="mt-3 sm:mt-1.5"
                />
            ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                    No extracted fields.
                </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
                {new Date(item.occurredAt).toLocaleTimeString()}
            </p>

            <Separator className="my-3 sm:hidden" />
            <div className="md:hidden">
                <TimelineEventRowActions
                    item={item}
                    reviewState={displayReviewState}
                    onSelect={onSelect}
                    onReviewUpdated={onReviewUpdated}
                    layout="mobile"
                />
            </div>
        </div>
    );
}
