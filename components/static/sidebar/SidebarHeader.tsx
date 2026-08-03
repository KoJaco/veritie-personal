"use client";

import Link from "next/link";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { getLensFromSearchParams, withLens } from "@/lib/lens";
import { useSearchParams } from "next/navigation";

interface SidebarHeaderProps {
    className?: string;
}

/**
 * SidebarHeader component
 * 
 * Contains the logo/product mark that navigates to /work.
 * Per ADR 0005: Logo navigates to /work, no tenant switching here... can navigate wherever is sensible.
 */
function SidebarHeaderInner({ className }: SidebarHeaderProps) {
    const searchParams = useSearchParams();
    const lens = getLensFromSearchParams(searchParams);
    return (
        <div className={cn("flex items-center h-16 lg:h-20 w-full", className)}>
            <Link
                href={withLens("/timeline", lens)}
                className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
            >
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    S
                </div>
                <span>Shell</span>
            </Link>
        </div>
    );
}

function SidebarHeaderFallback({ className }: SidebarHeaderProps) {
    return (
        <div className={cn("flex items-center h-16 lg:h-20 w-full", className)}>
            <div className="h-8 w-28 rounded bg-muted/50 animate-pulse" aria-hidden />
        </div>
    );
}

export function SidebarHeader({ className }: SidebarHeaderProps) {
    return (
        <Suspense fallback={<SidebarHeaderFallback className={className} />}>
            <SidebarHeaderInner className={className} />
        </Suspense>
    );
}
