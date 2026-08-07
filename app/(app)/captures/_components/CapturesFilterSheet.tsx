"use client";

import Link from "next/link";
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

type SortBy = "createdAt" | "title" | "extractedCount";
type SortDir = "asc" | "desc";
type ViewMode = "cards" | "table";

const ALL_FILTER_VALUE = "__all__";

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
    const [statusFilter, setStatusFilter] = useState(status ?? "");
    const [sortByFilter, setSortByFilter] = useState(sortBy);
    const [sortDirFilter, setSortDirFilter] = useState(sortDir);

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
                    <Input type="hidden" name="aspect" value={aspect} />
                    {search ? (
                        <Input type="hidden" name="q" value={search} />
                    ) : null}
                    <Input type="hidden" name="view" value={view} />
                    <Input type="hidden" name="status" value={statusFilter} />
                    <Input type="hidden" name="sortBy" value={sortByFilter} />
                    <Input type="hidden" name="sortDir" value={sortDirFilter} />
                    <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select
                            value={statusFilter || ALL_FILTER_VALUE}
                            onValueChange={(value) =>
                                setStatusFilter(
                                    value === ALL_FILTER_VALUE ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>
                                    All statuses
                                </SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                                <SelectItem value="processing">
                                    Processing
                                </SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Sort by</Label>
                        <Select
                            value={sortByFilter}
                            onValueChange={(value) =>
                                setSortByFilter(value as SortBy)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt">
                                    Date captured
                                </SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="extractedCount">
                                    Extracted count
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Direction</Label>
                        <Select
                            value={sortDirFilter}
                            onValueChange={(value) =>
                                setSortDirFilter(value as SortDir)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Descending</SelectItem>
                                <SelectItem value="asc">Ascending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <SheetFooter className="px-0">
                        <Button type="submit">Apply filters</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/captures">Clear all</Link>
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
