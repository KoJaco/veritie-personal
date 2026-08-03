"use client";

import { ModeToggle } from "@/components/theme/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
    className?: string;
}

export function SidebarFooter({ className }: SidebarFooterProps) {
    return (
        <div className={cn("mt-auto", className)}>
            <Separator className="mb-4 opacity-50" />
            <div className="flex flex-row items-end justify-between gap-x-3">
                <div>
                    <h3 className="mb-0.5 text-xs text-foreground/75">Theme</h3>
                    <ModeToggle />
                </div>
            </div>
        </div>
    );
}
