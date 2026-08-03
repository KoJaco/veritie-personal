import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { StubBootstrapSummary } from "@/lib/onboarding-stub";

export function FreshModePlaceholder({
    title,
    description,
    summary,
    primaryAction,
    secondaryAction,
    callouts,
}: {
    title: string;
    description: string;
    summary: StubBootstrapSummary | null;
    primaryAction: { href: string; label: string };
    secondaryAction?: { href: string; label: string };
    callouts: string[];
}) {
    const aspectCount = summary?.enabledAspects?.length ?? 0;

    return (
        <div className="space-y-12 py-6">
            <section className={cn(SURFACE_CLASS, "space-y-6 p-4")}>
                <div className="space-y-2">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        Personal setup
                    </p>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className={cn(SURFACE_CLASS_NESTED, "space-y-1 p-4")}>
                        <p className="text-sm text-muted-foreground">
                            Enabled aspects
                        </p>
                        <p className="text-2xl font-semibold">{aspectCount}</p>
                    </div>
                    <div className={cn(SURFACE_CLASS_NESTED, "space-y-1 p-4")}>
                        <p className="text-sm text-muted-foreground">
                            Capture preference
                        </p>
                        <p className="text-2xl font-semibold capitalize">
                            {summary?.capturePreference?.replace(/_/g, " ") ??
                                "—"}
                        </p>
                    </div>
                    <div className={cn(SURFACE_CLASS_NESTED, "space-y-1 p-4")}>
                        <p className="text-sm text-muted-foreground">AI mode</p>
                        <p className="text-2xl font-semibold capitalize">
                            {summary?.aiMode ?? "—"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href={primaryAction.href}>
                            {primaryAction.label}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                    {secondaryAction ? (
                        <Button variant="outline" asChild>
                            <Link href={secondaryAction.href}>
                                {secondaryAction.label}
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </section>

            <section className="space-y-3">
                <div className="space-y-1.5">
                    <h3 className="text-base font-semibold">What to do here later</h3>
                    <p className="text-sm text-muted-foreground">
                        This route stays reachable during onboarding, but it is
                        intentionally held in setup-aware placeholder mode until
                        the core bootstrap work is complete.
                    </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    {callouts.map((callout) => (
                        <div
                            key={callout}
                            className={cn(
                                SURFACE_CLASS,
                                "p-4 text-sm text-muted-foreground",
                            )}
                        >
                            {callout}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
