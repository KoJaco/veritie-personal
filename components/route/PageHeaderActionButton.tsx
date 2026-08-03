"use client";

import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderActionButtonProps = ComponentProps<typeof Button> & {
    icon: LucideIcon;
    label: string;
};

export function PageHeaderActionButton({
    icon: Icon,
    label,
    className,
    children,
    ...props
}: PageHeaderActionButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("gap-2 max-sm:px-2.5", className)}
            aria-label={label}
            {...props}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            {children}
        </Button>
    );
}
