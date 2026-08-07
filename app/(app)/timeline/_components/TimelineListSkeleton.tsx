import { Skeleton } from "@/components/ui/skeleton";

function TimelineEventRowSkeleton() {
    return (
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex items-center gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-5 w-3/5" />
            <Skeleton className="mt-1.5 h-4 w-full max-w-md" />
            <Skeleton className="mt-2 h-3 w-16" />
        </div>
    );
}

export function TimelineListSkeleton() {
    return (
        <div className="space-y-8 py-4">
            <section className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <div className="space-y-1.5">
                    <TimelineEventRowSkeleton />
                    <TimelineEventRowSkeleton />
                    <TimelineEventRowSkeleton />
                </div>
            </section>
            <section className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-1.5">
                    <TimelineEventRowSkeleton />
                    <TimelineEventRowSkeleton />
                </div>
            </section>
        </div>
    );
}
