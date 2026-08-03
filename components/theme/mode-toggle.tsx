"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themeButtons = [
    {
        mode: "light" as const,
        icon: Sun,
        label: "Light",
    },
    {
        mode: "dark" as const,
        icon: Moon,
        label: "Dark",
    },
    {
        mode: "system" as const,
        icon: Monitor,
        label: "System",
    },
];

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const activeTheme =
        theme !== undefined ? (theme as "system" | "light" | "dark") : null;

    return (
        <div className="flex items-center gap-0.5 rounded-2xl border px-1 py-0.5 bg-transparent">
            {themeButtons.map(({ mode, icon: Icon, label }) => (
                <Button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                        "text-foreground rounded-2xl border-none transition-colors duration-300 bg-transparent h-6.5 w-6.5",
                        activeTheme === null
                            ? "bg-transparent hover:bg-transparent"
                            : mode === activeTheme
                              ? "bg-primary text-primary-foreground hover:bg-primary/75"
                              : "hover:bg-primary/10",
                    )}
                >
                    <span className="sr-only">{label}</span>
                    <Icon className="h-[0.8rem] w-[0.8rem]" />
                </Button>
            ))}
        </div>
    );
}
