"use client";

import { useEffect, useState } from "react";
import { CircleCheckBig, CircleX, Undo2 } from "lucide-react";
import { updateExtractedValueReviewAction } from "@/lib/actions/stub-data-mutations";
import type { ReviewState } from "@/lib/domain/extraction";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReviewTargetState = "confirmed" | "rejected" | "pending";

async function submitExtractedValueReview(
    extractedValueId: string,
    nextState: ReviewTargetState,
): Promise<boolean> {
    const result = await updateExtractedValueReviewAction(
        extractedValueId,
        nextState,
    );
    return result.ok;
}

export function ExtractedValueInlineReviewActions({
    extractedValueId,
    reviewState,
    onUpdated,
    className,
    compact = false,
}: {
    extractedValueId: string;
    reviewState: ReviewState;
    onUpdated?: (state: ReviewState) => void;
    className?: string;
    compact?: boolean;
}) {
    const [pending, setPending] = useState(false);
    const [localState, setLocalState] = useState(reviewState);

    useEffect(() => {
        setLocalState(reviewState);
    }, [reviewState]);

    const handleSubmit = async (nextState: ReviewTargetState) => {
        setPending(true);
        try {
            const ok = await submitExtractedValueReview(
                extractedValueId,
                nextState,
            );
            if (!ok) {
                return;
            }
            setLocalState(nextState);
            onUpdated?.(nextState);
        } finally {
            setPending(false);
        }
    };

    if (localState === "pending") {
        return (
            <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    className={cn("gap-1.5", compact && "h-7 px-2.5 shadow-none")}
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleSubmit("rejected");
                    }}
                >
                    <span>Reject</span>
                    <CircleX className="size-3.5 shrink-0" />
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={pending}
                    className={cn("gap-1.5", compact && "h-7 px-2.5 shadow-none")}
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleSubmit("confirmed");
                    }}
                >
                    <span>Accept</span>
                    <CircleCheckBig className="size-3.5 shrink-0" />
                </Button>
            </div>
        );
    }

    if (localState === "confirmed" || localState === "rejected") {
        return (
            <div className={cn("flex items-center", className)}>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    className={cn("gap-1.5", compact && "h-7 px-2.5 shadow-none")}
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleSubmit("pending");
                    }}
                    title="Rollback"
                >
                    <Undo2 className="size-3.5 shrink-0" />
                    <span className="text-primary/75">Undo</span>
                </Button>
            </div>
        );
    }

    return null;
}

export { submitExtractedValueReview };
