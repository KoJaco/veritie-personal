import { Skeleton } from "@/components/ui/skeleton";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

function CaptureCardSkeleton() {
    return (
        <div className={cn(SURFACE_CLASS, "px-4 py-3")}>
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-2/5" />
            </div>
            <Skeleton className="mt-1 h-4 w-48" />
            <Skeleton className="mt-1 h-4 w-20" />
        </div>
    );
}

function CaptureDateGroupSkeleton({ cardCount }: { cardCount: number }) {
    return (
        <section className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="space-y-2">
                {Array.from({ length: cardCount }).map((_, index) => (
                    <CaptureCardSkeleton key={index} />
                ))}
            </div>
        </section>
    );
}

function CapturesCardsSkeleton() {
    return (
        <div className="space-y-8">
            <CaptureDateGroupSkeleton cardCount={5} />
            <CaptureDateGroupSkeleton cardCount={4} />
        </div>
    );
}

function CapturesTableSkeleton() {
    return (
        <section className={cn(SURFACE_CLASS, "p-0")}>
            <div className="border-b border-border/70 px-4 py-3">
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 justify-self-end" />
                </div>
            </div>
            <div className="divide-y divide-border/70">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20 justify-self-end" />
                    </div>
                ))}
            </div>
        </section>
    );
}

export function CapturesListSkeleton({
    view = "cards",
}: {
    view?: "cards" | "table";
}) {
    return view === "table" ? (
        <CapturesTableSkeleton />
    ) : (
        <CapturesCardsSkeleton />
    );
}
