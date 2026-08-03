import { useState } from "react";
import { format } from "date-fns";
import { ChevronDownIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";
import type { LensWindowPreset } from "@/lib/lens";
import { WINDOW_OPTIONS } from "../_lib/constants";

type WindowPresetSelectorProps = {
    value: LensWindowPreset;
    onChange: (next: LensWindowPreset) => void;
    customStart?: string;
    customEnd?: string;
    onCustomStartChange: (next?: string) => void;
    onCustomEndChange: (next?: string) => void;
};

function parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const [yearStr, monthStr, dayStr] = value.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return undefined;

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateString(value?: Date): string | undefined {
    if (!value) return undefined;
    return format(value, "yyyy-MM-dd");
}

function InlineDatePicker({
    label,
    value,
    onChange,
}: {
    label: string;
    value?: string;
    onChange: (next?: string) => void;
}) {
    const selected = parseDate(value);

    return (
        <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        data-empty={!selected}
                        className="data-[empty=true]:text-muted-foreground h-8 w-full justify-between text-left text-sm font-normal"
                    >
                        {selected ? format(selected, "PPP") : <span>Pick a date</span>}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selected}
                        onSelect={(date) => onChange(toDateString(date))}
                        defaultMonth={selected ?? new Date()}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function WindowPresetSelector({
    value,
    onChange,
    customStart,
    customEnd,
    onCustomStartChange,
    onCustomEndChange,
}: WindowPresetSelectorProps) {
    const isMobile = useIsMobileViewport();
    const [open, setOpen] = useState(false);
    const [draftStart, setDraftStart] = useState<string | undefined>(customStart);
    const [draftEnd, setDraftEnd] = useState<string | undefined>(customEnd);

    const handleOpenRange = () => {
        setDraftStart(customStart);
        setDraftEnd(customEnd);
        setOpen(true);
    };

    const handleApply = () => {
        onCustomStartChange(draftStart);
        onCustomEndChange(draftEnd);
        setOpen(false);
    };

    const pickerContent = (
        <div className="space-y-4 px-1">
            <div className="grid gap-2 sm:grid-cols-2">
                <InlineDatePicker
                    label="Start"
                    value={draftStart}
                    onChange={setDraftStart}
                />
                <InlineDatePicker
                    label="End"
                    value={draftEnd}
                    onChange={setDraftEnd}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleApply}
                >
                    Apply
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-2">
                {WINDOW_OPTIONS.map((option) => (
                    <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={option === value ? "default" : "outline"}
                        onClick={() => onChange(option)}
                    >
                        {option}
                    </Button>
                ))}
            </div>



            {value === "custom" ? (
                <div className="flex items-center gap-4">
                    <span className="w-px h-6 bg-foreground/10" />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {customStart ?? "Start"} - {customEnd ?? "End"}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleOpenRange}
                        >
                            <PencilIcon className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ) : null}

            {isMobile ? (
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Custom Coverage Window</DrawerTitle>
                            <DrawerDescription>
                                Select the start and end dates for coverage window analysis.
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-4">{pickerContent}</div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Custom Coverage Window</DialogTitle>
                            <DialogDescription>
                                Select the start and end dates for coverage window analysis.
                            </DialogDescription>
                        </DialogHeader>
                        {pickerContent}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
