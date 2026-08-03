"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLensFromSearchParams, withLens } from "@/lib/lens";

interface SidebarItemProps {
    href: string;
    icon: LucideIcon;
    label: string;
    className?: string;
}

/**
 * SidebarItem component
 *
 * Individual navigation item in the sidebar.
 * Highlights when the current route matches the href.
 * Per ADR 0004: No dropdowns, no sub-items - flat navigation only.
 */
function SidebarItemInner({
    href,
    icon: Icon,
    label,
    className,
}: SidebarItemProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lens = getLensFromSearchParams(searchParams);
    const nextHref = withLens(href, lens);
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={nextHref}
            className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                "dark:hover:bg-accent/25 hover:bg-card/50 dark:hover:text-accent-foreground",
                isActive &&
                    "bg-card dark:bg-accent text-accent-foreground dark:hover:bg-accent/75 hover:bg-card/75",
                className,
            )}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </Link>
    );
}

function SidebarItemFallback({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md",
                "h-9 bg-muted/40 animate-pulse",
                className,
            )}
            aria-hidden
        />
    );
}

export function SidebarItem(props: SidebarItemProps) {
    return (
        <Suspense
            fallback={<SidebarItemFallback className={props.className} />}
        >
            <SidebarItemInner {...props} />
        </Suspense>
    );
}
