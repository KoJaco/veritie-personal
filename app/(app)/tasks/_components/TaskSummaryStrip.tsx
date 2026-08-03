import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { TaskIndexSummaryReadModel } from "@/lib/data-source";

type TaskSummaryStripProps = {
    summary: TaskIndexSummaryReadModel;
};

export function TaskSummaryStrip({ summary }: TaskSummaryStripProps) {
    const items = [
        { label: "Open setup tasks", value: summary.open },
        { label: "Blocked setup tasks", value: summary.blocked },
        { label: "Due soon", value: summary.dueSoon },
        { label: "Completed", value: summary.completed },
        { label: "Overdue", value: summary.overdue },
    ];

    return (
        <section
            aria-label="Task summary"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
            {items.map((item) => (
                <div
                    key={item.label}
                    className={cn(SURFACE_CLASS, "space-y-1 p-4")}
                >
                    <p className="text-sm text-muted-foreground">
                        {item.label}
                    </p>
                    <p className={cn("text-2xl font-semibold text-foreground")}>
                        {item.value}
                    </p>
                </div>
            ))}
        </section>
    );
}
