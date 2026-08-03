"use client";

import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:gap-3 group-[.toaster]:rounded-[var(--radius)]",
                    title: "text-sm font-medium",
                    description: "text-sm text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    success:
                        "group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-950 dark:group-[.toaster]:border-emerald-900/60 dark:group-[.toaster]:bg-emerald-950/40 dark:group-[.toaster]:text-emerald-100",
                    info: "group-[.toaster]:border-sky-200 group-[.toaster]:bg-sky-50 group-[.toaster]:text-sky-950 dark:group-[.toaster]:border-sky-900/60 dark:group-[.toaster]:bg-sky-950/40 dark:group-[.toaster]:text-sky-100",
                    warning:
                        "group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-950 dark:group-[.toaster]:border-amber-900/60 dark:group-[.toaster]:bg-amber-950/40 dark:group-[.toaster]:text-amber-100",
                    error:
                        "group-[.toaster]:border-rose-200 group-[.toaster]:bg-rose-50 group-[.toaster]:text-rose-950 dark:group-[.toaster]:border-rose-900/60 dark:group-[.toaster]:bg-rose-950/40 dark:group-[.toaster]:text-rose-100",
                },
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

export { Toaster };
