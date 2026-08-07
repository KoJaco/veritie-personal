"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { PageHeaderActionButton } from "@/components/route/PageHeaderActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";

const ALL_FILTER_VALUE = "__all__";

type TimelineFilterSheetProps = {
    aspect: string;
    search?: string;
    eventType?: TimelineEventType;
    reviewState?: string;
    startDate?: string;
    endDate?: string;
};

export function TimelineFilterSheet({
    aspect,
    search,
    eventType,
    reviewState,
    startDate,
    endDate,
}: TimelineFilterSheetProps) {
    const [open, setOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState(eventType ?? "");
    const [reviewFilter, setReviewFilter] = useState(reviewState ?? "");
    const [startDateFilter, setStartDateFilter] = useState(startDate ?? "");
    const [endDateFilter, setEndDateFilter] = useState(endDate ?? "");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <PageHeaderActionButton icon={Filter} label="Filters" />
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Timeline filters</SheetTitle>
                    <SheetDescription>
                        Narrow events by date, type, and review state.
                    </SheetDescription>
                </SheetHeader>
                <form
                    method="GET"
                    action="/timeline"
                    className="flex flex-col gap-4 px-4"
                >
                    <Input type="hidden" name="aspect" value={aspect} />
                    {search ? (
                        <Input type="hidden" name="q" value={search} />
                    ) : null}
                    <Input type="hidden" name="type" value={typeFilter} />
                    <Input type="hidden" name="review" value={reviewFilter} />
                    <Input type="hidden" name="startDate" value={startDateFilter} />
                    <Input type="hidden" name="endDate" value={endDateFilter} />
                    <div className="space-y-1.5">
                        <Label>Date range</Label>
                        <DateRangePicker
                            startDate={startDateFilter || undefined}
                            endDate={endDateFilter || undefined}
                            onChange={({ startDate: nextStart, endDate: nextEnd }) => {
                                setStartDateFilter(nextStart ?? "");
                                setEndDateFilter(nextEnd ?? "");
                            }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Event type</Label>
                        <Select
                            value={typeFilter || ALL_FILTER_VALUE}
                            onValueChange={(value) =>
                                setTypeFilter(
                                    value === ALL_FILTER_VALUE ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All event types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>
                                    All event types
                                </SelectItem>
                                {TIMELINE_SIGNAL_EVENT_TYPES.map((type) => (
                                    <SelectItem key={type} value={type} className="capitalize">

                                        {type.split("_")[0] ?? type.replace(/_/g, " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Review state</Label>
                        <Select
                            value={reviewFilter || ALL_FILTER_VALUE}
                            onValueChange={(value) =>
                                setReviewFilter(
                                    value === ALL_FILTER_VALUE ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All review states" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>
                                    All review states
                                </SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">
                                    Confirmed
                                </SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="edited">Edited</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
