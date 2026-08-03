"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarGroupProps {
    label?: string;
    children: ReactNode;
    className?: string;
}

/**
 * SidebarGroup component
 *
 * Groups related navigation items together.
 * Used to organize sidebar navigation into logical sections.
 */
export function SidebarGroup({
    label,
    children,
    className,
}: SidebarGroupProps) {
    return (
        <div className={cn("flex flex-col", className)}>
            {label && (
                <div className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                </div>
            )}
            <nav className="flex flex-col gap-1">{children}</nav>
        </div>
    );
}
