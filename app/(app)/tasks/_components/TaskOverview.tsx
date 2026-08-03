import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { TaskDetailReadModel } from "@/lib/data-source";
import { formatShortDate } from "@/lib/format/date";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ListTodo } from "lucide-react";

type TaskOverviewProps = {
    task: TaskDetailReadModel;
};

export function TaskOverview({ task }: TaskOverviewProps) {
    return (
        <section>
            <div className={cn(SURFACE_CLASS, "space-y-6 p-4")}>
                <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                        Task overview
                    </h2>
                    <p className="text-sm leading-6 text-foreground/75">
                        {task.description}
                    </p>
                </div>

                <blockquote
                    className={cn(
                        SURFACE_CLASS_NESTED,
                        "relative overflow-hidden rounded-r-xl rounded-l-md border-l-0 p-3 md:px-4 md:py-4",
                    )}
                >
                    <span
                        className={cn(
                            "absolute top-0 left-0 flex h-full w-1 rounded-l-md",
                            "bg-amber-500 dark:bg-amber-400",
                        )}
                    />

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-foreground/50">
                                Check impact
                                {task.blockers.length > 0
                                    ? ` · ${task.blockers.length} blocker${
                                          task.blockers.length === 1 ? "" : "s"
                                      }`
                                    : ""}
                            </p>
                            <p className="text-sm leading-6 text-foreground">
                                {task.checkContext}
                            </p>
                        </div>
                        {task.blockers.length > 0 ? (
                            <div>
                                {task.blockers.map((blocker) => (
                                    <div key={blocker.id}>
                                        <p className="text-xs uppercase tracking-wide text-foreground/50">
                                            {blocker.type}
                                        </p>{" "}
                                        <p className="text-sm leading-6 text-foreground">
                                            {blocker.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </blockquote>

                <div className="grid gap-1.5 md:grid-cols-3 xl:grid-cols-5">
                    <InfoBlock
                        label="Linked check"
                        value={task.check.title}
                    />
                    <InfoBlock
                        label="Scope context"
                        value={task.scopeLabels.join(", ")}
                    />
                    <InfoBlock
                        label="Status"
                        value={<StatusBadge status={task.status} />}
                    />
                    <InfoBlock
                        label="Due"
                        value={
                            task.dueAt
                                ? formatShortDate(task.dueAt)
                                : "No due date"
                        }
                    />
                    <InfoBlock label="Owner" value={task.owner.name} />
                </div>
            </div>
        </section>
    );
}

function InfoBlock({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className={cn(SURFACE_CLASS_NESTED, "space-y-1.5 p-3")}>
            <p className="text-xs uppercase tracking-wide text-foreground/50">
                {label}
            </p>
            <div className="text-sm font-medium text-foreground">{value}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: TaskDetailReadModel["status"] }) {
    if (status === "completed") {
        return (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                Completed
            </Badge>
        );
    }

    if (status === "blocked") {
        return (
            <Badge className="bg-orange-600 text-white hover:bg-orange-600">
                Blocked
            </Badge>
        );
    }

    if (status === "in_progress") {
        return <Badge variant="secondary">In progress</Badge>;
    }

    return <Badge variant="outline">Open</Badge>;
}
