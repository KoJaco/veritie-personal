import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { TaskIndexItemReadModel } from "@/lib/data-source";
import { TaskRow } from "./TaskRow";

type TaskListProps = {
    lens: ScopeLens;
    items: TaskIndexItemReadModel[];
    hasFilters: boolean;
    emptyStateAction?: ReactNode;
};

export function TaskList({
    lens,
    items,
    hasFilters,
    emptyStateAction,
}: TaskListProps) {
    if (items.length === 0) {
        return (
            <div
                className={cn(
                    SURFACE_CLASS,
                    "flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center",
                )}
            >
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">
                        {hasFilters
                            ? "No tasks match these filters"
                            : "No setup tasks yet"}
                    </h2>
                    <p className="max-w-md text-sm text-muted-foreground">
                        {hasFilters
                            ? "Try clearing one or more filters to widen the work queue."
                            : "Setup tasks will appear here as the onboarding bootstrap expands. You can still draft a task manually for frontend preview."}
                    </p>
                </div>
                {hasFilters ? (
                    <Button variant="outline" asChild>
                        <Link href={withLens("/tasks", lens)}>
                            Clear filters
                        </Link>
                    </Button>
                ) : (
                    emptyStateAction ?? null
                )}
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {items.map((task) => (
                <TaskRow key={task.id} lens={lens} task={task} />
            ))}
        </section>
    );
}
