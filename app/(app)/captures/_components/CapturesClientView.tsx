"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import type { CaptureIndexItem } from "@/lib/data-source/captures-read-model";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCaptureLiveUpdates } from "@/components/captures/CapturesLiveProvider";
import { buildIndexHref } from "@/lib/route/build-index-href";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

const MotionTableRow = motion.create(TableRow);

type ViewMode = "cards" | "table";
type SortBy = "createdAt" | "title" | "extractedCount";
type SortDir = "asc" | "desc";

function groupByDate(items: CaptureIndexItem[]) {
    const groups = new Map<string, CaptureIndexItem[]>();
    for (const item of items) {
        const key = item.createdAt.slice(0, 10);
        const list = groups.get(key) ?? [];
        list.push(item);
        groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function CapturesClientView({
    items,
    aspect,
    search,
    status,
    sortBy,
    sortDir,
    view,
}: {
    items: CaptureIndexItem[];
    aspect: string;
    search?: string;
    status?: string;
    sortBy: SortBy;
    sortDir: SortDir;
    view: ViewMode;
}) {
    const shouldReduceMotion = useReducedMotion();
    const { pendingNewIds, lastEnrichedIds, clearAnimatedIds } =
        useCaptureLiveUpdates();
    const groups = useMemo(() => groupByDate(items), [items]);

    const baseParams = {
        aspect,
        q: search,
        status,
        sortBy,
        sortDir,
        view,
    };

    const enterOffset =
        sortDir === "asc" ? 12 : sortDir === "desc" ? -12 : 8;

    const listItemMotion = {
        hidden: shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: enterOffset },
        visible: { opacity: 1, y: 0 },
    };

    useEffect(() => {
        for (const captureId of [...pendingNewIds, ...lastEnrichedIds]) {
            if (items.some((item) => item.id === captureId)) {
                clearAnimatedIds(captureId);
            }
        }
    }, [items, pendingNewIds, lastEnrichedIds, clearAnimatedIds]);

    return (
        <div className="space-y-6">
            {view === "table" ? (
                <section className={cn(SURFACE_CLASS, "p-0")}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <SortLink
                                        label="Capture"
                                        sortBy="title"
                                        currentSortBy={sortBy}
                                        currentSortDir={sortDir}
                                        baseParams={baseParams}
                                    />
                                </TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    <SortLink
                                        label="Extracted"
                                        sortBy="extractedCount"
                                        currentSortBy={sortBy}
                                        currentSortDir={sortDir}
                                        baseParams={baseParams}
                                    />
                                </TableHead>
                                <TableHead>
                                    <SortLink
                                        label="Captured"
                                        sortBy="createdAt"
                                        currentSortBy={sortBy}
                                        currentSortDir={sortDir}
                                        baseParams={baseParams}
                                    />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <MotionTableRow
                                    key={item.id}
                                    layout={!shouldReduceMotion}
                                    initial="hidden"
                                    animate="visible"
                                    variants={listItemMotion}
                                    transition={{
                                        duration: shouldReduceMotion ? 0 : 0.25,
                                    }}
                                >
                                    <TableCell>
                                        <Link
                                            href={`/captures/${item.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {item.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.type}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {item.extractedCount}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </TableCell>
                                </MotionTableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>
            ) : (
                <div className="space-y-8">
                    {groups.map(([date, groupItems]) => (
                        <section key={date} className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                {new Date(date).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </h2>
                            <div className="space-y-2">
                                {groupItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout={!shouldReduceMotion}
                                        initial="hidden"
                                        animate="visible"
                                        variants={listItemMotion}
                                        transition={{
                                            duration: shouldReduceMotion
                                                ? 0
                                                : 0.25,
                                        }}
                                    >
                                        <Link
                                            href={`/captures/${item.id}`}
                                            className={cn(
                                                SURFACE_CLASS,
                                                "block px-4 py-3 transition-colors hover:bg-accent/40",
                                            )}
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">
                                                    {item.title}
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px]"
                                                >
                                                    {item.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.type} ·{" "}
                                                {item.extractedCount} extracted
                                                ·{" "}
                                                {new Date(
                                                    item.createdAt,
                                                ).toLocaleTimeString(undefined, {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {items.length === 0 && (
                <div
                    className={cn(
                        SURFACE_CLASS,
                        "p-4 min-h-96 flex items-center justify-center",
                    )}
                >
                    <p className="text-sm text-muted-foreground max-w-sm text-center">
                        No captures match your filters. Use the capture launcher
                        to add a voice log.
                    </p>
                </div>
            )}
        </div>
    );
}

function SortLink({
    label,
    sortBy,
    currentSortBy,
    currentSortDir,
    baseParams,
}: {
    label: string;
    sortBy: SortBy;
    currentSortBy: SortBy;
    currentSortDir: SortDir;
    baseParams: Record<string, string | undefined>;
}) {
    const isActive = currentSortBy === sortBy;
    const nextDir =
        isActive && currentSortDir === "desc" ? "asc" : "desc";

    return (
        <Link
            href={buildIndexHref("/captures", baseParams, {
                sortBy,
                sortDir: nextDir,
            })}
            className="inline-flex items-center gap-1 hover:text-foreground"
        >
            {label}
            {isActive ? (
                currentSortDir === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                )
            ) : null}
        </Link>
    );
}
