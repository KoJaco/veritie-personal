"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { PageHeaderActionButton } from "@/components/route/PageHeaderActionButton";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { TIMELINE_SIGNAL_EVENT_TYPES } from "@/lib/domain/timeline-filters";
import type { TimelineEventType } from "@/lib/domain/timeline";

type TimelineFilterSheetProps = {
    aspect: string;
    search?: string;
    eventType?: TimelineEventType;
    reviewState?: string;
};

export function TimelineFilterSheet({
    aspect,
    search,
    eventType,
    reviewState,
}: TimelineFilterSheetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <PageHeaderActionButton icon={Filter} label="Filters" />
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Timeline filters</SheetTitle>
                    <SheetDescription>
                        Narrow events by type and review state.
                    </SheetDescription>
                </SheetHeader>
                <form
                    method="GET"
                    action="/timeline"
                    className="flex flex-col gap-4 px-4"
                >
                    <input type="hidden" name="aspect" value={aspect} />
                    {search ? (
                        <input type="hidden" name="q" value={search} />
                    ) : null}
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Event type</span>
                        <select
                            name="type"
                            defaultValue={eventType ?? ""}
                            className="h-9 w-full rounded-md border border-input bg-background px-3"
                        >
                            <option value="">All event types</option>
                            {TIMELINE_SIGNAL_EVENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Review state</span>
                        <select
                            name="review"
                            defaultValue={reviewState ?? ""}
                            className="h-9 w-full rounded-md border border-input bg-background px-3"
                        >
                            <option value="">All review states</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="rejected">Rejected</option>
                            <option value="edited">Edited</option>
                        </select>
                    </label>
                    <SheetFooter className="px-0">
                        <Button type="submit">Apply filters</Button>
                        <Button type="button" variant="outline" asChild>
                            <a href="/timeline">Clear all</a>
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
