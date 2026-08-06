import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { envPublic } from "@/lib/config/env.public";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-background">
            <header className="absolute top-0 left-0 z-50 w-full">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-8">
                    <span className="text-sm font-medium tracking-tight">
                        {envPublic.appName}
                    </span>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground group"
                    >
                        <ArrowLeft
                            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                        />
                        Home
                    </Link>
                </div>
            </header>
            <main className="flex min-h-screen items-center justify-center px-4 py-16">
                <div className={cn(SURFACE_CLASS, "w-full max-w-md p-6")}>
                    {children}
                </div>
            </main>
        </div>
    );
}
