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

type SortBy = "createdAt" | "title" | "extractedCount";
type SortDir = "asc" | "desc";
type ViewMode = "cards" | "table";

type CapturesFilterSheetProps = {
    aspect: string;
    search?: string;
    status?: string;
    sortBy: SortBy;
    sortDir: SortDir;
    view: ViewMode;
};

export function CapturesFilterSheet({
    aspect,
    search,
    status,
    sortBy,
    sortDir,
    view,
}: CapturesFilterSheetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <PageHeaderActionButton icon={Filter} label="Filters" />
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Capture filters</SheetTitle>
                    <SheetDescription>
                        Filter by status and sort order.
                    </SheetDescription>
                </SheetHeader>
                <form
                    method="GET"
                    action="/captures"
                    className="flex flex-col gap-4 px-4"
                >
                    <input type="hidden" name="aspect" value={aspect} />
                    {search ? (
                        <input type="hidden" name="q" value={search} />
                    ) : null}
                    <input type="hidden" name="view" value={view} />
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Status</span>
                        <select
                            name="status"
                            defaultValue={status ?? ""}
                            className="h-9 w-full rounded-md border border-input bg-background px-3"
                        >
                            <option value="">All statuses</option>
                            <option value="completed">Completed</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                        </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Sort by</span>
                        <select
                            name="sortBy"
                            defaultValue={sortBy}
                            className="h-9 w-full rounded-md border border-input bg-background px-3"
                        >
                            <option value="createdAt">Date captured</option>
                            <option value="title">Title</option>
                            <option value="extractedCount">
                                Extracted count
                            </option>
                        </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Direction</span>
                        <select
                            name="sortDir"
                            defaultValue={sortDir}
                            className="h-9 w-full rounded-md border border-input bg-background px-3"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </label>
                    <SheetFooter className="px-0">
                        <Button type="submit">Apply filters</Button>
                        <Button type="button" variant="outline" asChild>
                            <a href="/captures">Clear all</a>
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
