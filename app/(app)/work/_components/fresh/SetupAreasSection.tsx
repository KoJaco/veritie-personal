"use client";

import Link from "next/link";
import { Layers3, MoveRight } from "lucide-react";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import type { FreshDashboardArea } from "@/lib/onboarding-stub";

export function SetupAreasSection({
    areas,
    lens,
}: {
    areas: FreshDashboardArea[];
    lens: ScopeLens;
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Layers3 className="h-4 w-4 text-muted-foreground" />
                    Setup areas
                </h2>
                <p className="text-sm text-muted-foreground">
                    Follow the grouped setup lanes prepared from the
                    onboarding bootstrap.
                </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                {areas.map((area) => (
                    <div key={area.id} className={`${SURFACE_CLASS} p-4`}>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-medium">{area.title}</h3>
                                <p className="text-sm text-foreground/60">
                                    {area.summary}
                                </p>
                                <p className="mt-1.5 text-sm text-foreground/50">
                                    {area.statusNote}
                                </p>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-foreground/80"
                                    style={{ width: `${area.progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                <span>
                                    {area.openTaskCount} open task
                                    {area.openTaskCount === 1 ? "" : "s"}
                                </span>
                                <span>{area.progress}% staged</span>
                            </div>

                            <Link
                                href={withLens(area.taskHref, lens)}
                                className={`${SURFACE_CLASS_NESTED} group flex items-center justify-between gap-3 p-3 text-sm text-muted-foreground transition-colors hover:border-foreground/15 hover:bg-background/70 hover:text-foreground`}
                            >
                                <span>Open setup tasks</span>
                                <MoveRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
