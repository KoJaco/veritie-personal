import { Skeleton } from "@/components/ui/skeleton";

export function TimelineDetailBodySkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-4 w-full max-w-md" />
            <section className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="rounded-lg border border-border/70 p-3 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                </div>
            </section>
            <section className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="rounded-lg border border-border/70 p-3 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(8rem,30%)_1fr]">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(8rem,30%)_1fr]">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                </div>
            </section>
        </div>
    );
}
