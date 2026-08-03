"use client";

import Link from "next/link";
import { Layers3, MoveRight } from "lucide-react";
import type { DashboardWorkstream } from "../_page-model/composeVM";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";

export function ActiveWorkstreams({
    workstreams,
}: {
    workstreams: DashboardWorkstream[];
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Layers3 className="h-4 w-4 text-muted-foreground" />
                    Active Workstreams
                </h2>
                <p className="text-sm text-muted-foreground">
                    Follow the named story bundles that anchor the demo routes.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {workstreams.map((workstream) => (
                    <div key={workstream.id} className={`${SURFACE_CLASS} p-4`}>
                        <div className="space-y-3">
                            <div className="">
                                <h3 className="font-medium">
                                    {workstream.title}
                                </h3>
                                <p className="text-sm text-foreground/50">
                                    {workstream.summary}
                                </p>
                                <p className="mt-1.5 text-sm text-foreground/50">
                                    {workstream.statusNote}
                                </p>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-foreground/80"
                                    style={{ width: `${workstream.progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                <span>
                                    {workstream.openTaskCount} open task
                                    {workstream.openTaskCount === 1 ? "" : "s"}
                                </span>
                                <span
                                    className={cn(
                                        workstream.missingAttachmentCount > 0
                                            ? "text-amber-700 dark:text-amber-400"
                                            : "",
                                    )}
                                >
                                    {workstream.missingAttachmentCount} missing
                                    attachment
                                    {workstream.missingAttachmentCount === 1
                                        ? ""
                                        : "s"}
                                </span>
                            </div>

                            <div>
                                <WorkstreamLinkTile
                                    href={workstream.taskHref}
                                    label="Open workstream tasks"
                                    tone="default"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function WorkstreamLinkTile({
    href,
    label,
    tone = "default",
}: {
    href: string;
    label: string;
    tone?: "default" | "warning";
}) {
    return (
        <Link
            href={href}
            className={cn(
                SURFACE_CLASS_NESTED,
                "group flex items-center justify-between gap-3 p-3 text-sm text-muted-foreground transition-colors hover:border-foreground/15 hover:bg-background/70 hover:text-foreground",
                tone === "warning" &&
                    "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300",
            )}
        >
            <span>{label}</span>
            <MoveRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}
