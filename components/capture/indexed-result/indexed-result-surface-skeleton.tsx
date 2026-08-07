import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

export function IndexedResultSurfaceSkeleton({
    expectAudio = true,
    className,
}: {
    expectAudio?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("flex h-full flex-col gap-3", className)}>
            <div className="grid gap-3 lg:grid-cols-2 lg:items-start lg:gap-6">
                <div className="grid min-w-0 gap-3 lg:pr-6">
                    {expectAudio ? (
                        <section className="grid gap-3">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </section>
                    ) : null}
                    {expectAudio ? <Separator className="my-3 opacity-50" /> : null}
                    <section className="grid gap-3">
                        <Skeleton className="h-4 w-20" />
                        <div className={cn(SURFACE_CLASS, "space-y-2 p-3")}>
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-4/5" />
                            <Skeleton className="h-3 w-3/5" />
                        </div>
                    </section>
                </div>
                <div className="grid min-w-0 gap-3">
                    <Separator className="my-3 opacity-50 lg:hidden" />
                    <section className="grid gap-3">
                        <Skeleton className="h-4 w-20" />
                        <div className={cn(SURFACE_CLASS, "space-y-2 p-3")}>
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-3/5" />
                            <Skeleton className="h-4 w-2/5" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
