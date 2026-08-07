"use client";

import Link from "next/link";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildIndexHref } from "@/lib/route/build-index-href";
import { cn } from "@/lib/utils";

export type IndexViewMode = "cards" | "table";

type IndexViewToggleProps = {
    route: string;
    baseParams: Record<string, string | undefined>;
    view: IndexViewMode;
    className?: string;
};

export function IndexViewToggle({
    route,
    baseParams,
    view,
    className,
}: IndexViewToggleProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 rounded-md border border-border/70 p-0.5 h-8",
                className,
            )}
        >
            <Button
                type="button"
                variant={view === "cards" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Card view"
                aria-pressed={view === "cards"}
                asChild
                className="h-7"
            >
                <Link
                    href={buildIndexHref(route, baseParams, { view: "cards" })}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Link>
            </Button>
            <Button
                type="button"
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Table view"
                aria-pressed={view === "table"}
                asChild
                className="h-7"
            >
                <Link
                    href={buildIndexHref(route, baseParams, { view: "table" })}
                >
                    <TableIcon className="h-4 w-4" />
                </Link>
            </Button>
        </div>
    );
}
