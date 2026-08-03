"use client";

import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { FreshDashboardAction } from "@/lib/onboarding-stub";
import React from "react";

export function SetupActionSection({
    title,
    description,
    lens,
    items,
    icon,
    tone = "default",
}: {
    title: string;
    description: string;
    lens: ScopeLens;
    items: FreshDashboardAction[];
    icon?: React.ReactNode;
    tone?: "default" | "warning";
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    {icon}
                    {title}
                </h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="grid gap-3">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={withLens(item.href, lens)}
                        className={cn(SURFACE_CLASS, "block p-4")}
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5">
                                    <h3 className="font-medium">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <div
                                className={cn(
                                    SURFACE_CLASS_NESTED,
                                    "flex items-center justify-between gap-3 p-3 text-sm text-muted-foreground transition-colors hover:border-foreground/15 hover:text-foreground",
                                )}
                            >
                                <span>Open setup task</span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
