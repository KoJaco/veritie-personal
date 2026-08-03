import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TaskResourceSummaryReadModel } from "@/lib/data-source";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ArrowRight, ServerCog } from "lucide-react";

type TaskResourcesSectionProps = {
    lens: ScopeLens;
    resource?: TaskResourceSummaryReadModel;
};

export function TaskResourcesSection({
    lens,
    resource,
}: TaskResourcesSectionProps) {
    if (!resource) {
        return null;
    }

    return (
        <section>
            <div className={cn(SURFACE_CLASS, "space-y-3 p-4")}>
                <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ServerCog className="h-4 w-4 text-muted-foreground" />
                        Resources
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Related resource context for this work item.
                    </p>
                </div>

                <div
                    className={cn(
                        SURFACE_CLASS_NESTED,
                        "p-3 flex items-center justify-between",
                    )}
                >
                    <div className="space-y-1.5">
                        <p className="text-xs uppercase tracking-wide text-foreground/50">
                            {resource.category}
                        </p>
                        <p className="text-sm font-medium">{resource.name}</p>
                        {resource.summary ? (
                            <p className="text-sm text-foreground/75">
                                {resource.summary}
                            </p>
                        ) : null}
                    </div>
                    <Button variant="ghost" size="sm" asChild className="px-0">
                        <Link
                            href={withLens(
                                `/resources/${resource.id}`,
                                lens,
                            )}
                        >
                            View resource
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
