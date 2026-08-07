"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    parseCalendarDate,
    toCalendarDateString,
} from "@/lib/format/date-range";
import { cn } from "@/lib/utils";

export type CalendarDateRange = {
    startDate?: string;
    endDate?: string;
};

function toSelectedRange(range: CalendarDateRange): DateRange | undefined {
    const from = parseCalendarDate(range.startDate);
    const to = parseCalendarDate(range.endDate);

    if (!from && !to) {
        return undefined;
    }

    return { from, to };
}

function formatRangeLabel(range: CalendarDateRange): string {
    const from = parseCalendarDate(range.startDate);
    const to = parseCalendarDate(range.endDate);

    if (from && to) {
        return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
    }

    if (from) {
        return `${format(from, "MMM d, yyyy")} – …`;
    }

    return "Pick a date range";
}

export function DateRangePicker({
    startDate,
    endDate,
    onChange,
    className,
    id,
}: {
    startDate?: string;
    endDate?: string;
    onChange: (range: CalendarDateRange) => void;
    className?: string;
    id?: string;
}) {
    const range = { startDate, endDate };
    const selected = toSelectedRange(range);
    const hasSelection = Boolean(startDate || endDate);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    data-empty={!hasSelection}
                    className={cn(
                        "data-[empty=true]:text-muted-foreground h-9 w-full justify-start gap-2 text-left text-sm font-normal",
                        className,
                    )}
                >
                    <CalendarIcon className="size-4 shrink-0 opacity-60" />
                    <span className="truncate">{formatRangeLabel(range)}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={selected}
                    onSelect={(nextRange) =>
                        onChange({
                            startDate: toCalendarDateString(nextRange?.from),
                            endDate: toCalendarDateString(nextRange?.to),
                        })
                    }
                    defaultMonth={selected?.from ?? selected?.to ?? new Date()}
                    numberOfMonths={1}
                />
            </PopoverContent>
        </Popover>
    );
}
