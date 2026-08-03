import type { TaskActivityItemReadModel } from "@/lib/data-source";
import { formatRelativeDate } from "@/lib/format/date";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { Activity as ActivityIcon } from "lucide-react";

type TaskActivitySectionProps = {
    items: TaskActivityItemReadModel[];
};

export function TaskActivitySection({ items }: TaskActivitySectionProps) {
    return (
        <section>
            <div className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
                <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                        Activity
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Recent updates across the task and supporting attachments.
                    </p>
                </div>

                <div className="space-y-1.5">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                SURFACE_CLASS_NESTED,
                                "flex items-start justify-between gap-4 p-4",
                            )}
                        >
                            <div className="min-w-0 flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background/80">
                                    <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>

                                <p className="text-sm leading-6 text-foreground/90">
                                    <span className="font-medium text-foreground">
                                        {activityTypeLabel(item.type)}
                                    </span>{" "}
                                    <span className="text-muted-foreground">
                                        {item.summary}
                                    </span>
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {formatRelativeDate(item.occurredAt)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function activityTypeLabel(type: TaskActivityItemReadModel["type"]): string {
    return type.replaceAll("_", " ");
}
