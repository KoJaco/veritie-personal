import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate, formatShortDate } from "@/lib/format/date";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { TaskIndexItemReadModel } from "@/lib/data-source";
import { ArrowRight } from "lucide-react";

type TaskRowProps = {
    lens: ScopeLens;
    task: TaskIndexItemReadModel;
};

export function TaskRow({ lens, task }: TaskRowProps) {
    return (
        <Link
            href={withLens(`/work/tasks/${task.id}`, lens)}
            className={cn(SURFACE_CLASS, "block space-y-6 p-4")}
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <TaskStatusBadge
                            status={task.status}
                            isOverdue={task.isOverdue}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base font-semibold">
                            {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Linked check: {task.check.title}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start lg:justify-center"
                >
                    Open task
                    <ArrowRight />
                </Button>
            </div>

            <div className="grid gap-1.5 md:grid-cols-3 xl:grid-cols-5">
                <Metadata label="Due">
                    {task.dueAt ? formatShortDate(task.dueAt) : "No due date"}
                </Metadata>
                <Metadata label="Owner">{task.owner.name}</Metadata>
                <Metadata label="Attachments">
                    {task.attachmentCount} attached
                </Metadata>
                <Metadata label="Resource">
                    {task.resource?.name ?? "Not linked"}
                </Metadata>
                <Metadata label="Updated">
                    {formatRelativeDate(task.updatedAt)}
                </Metadata>
                <Metadata label="Scope">
                    {task.scopeLabels.join(", ")}
                </Metadata>
            </div>

            {task.blockerSummary ? (
                <div className="border border-border/50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/5 dark:text-amber-300 relative overflow-hidden rounded-lg">
                    <span className="bg-amber-500 w-1 h-full absolute top-0 left-0" />
                    {task.blockerSummary}
                </div>
            ) : null}
        </Link>
    );
}

function Metadata({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn(SURFACE_CLASS_NESTED, "space-y-1 p-4")}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                {label}
            </p>
            <p className="text-sm text-foreground">{children}</p>
        </div>
    );
}

function TaskStatusBadge({
    status,
    isOverdue,
}: {
    status: TaskIndexItemReadModel["status"];
    isOverdue: boolean;
}) {
    if (isOverdue && status !== "completed") {
        return (
            <Badge className="bg-rose-600 text-rose-100 hover:bg-rose-600">
                Overdue
            </Badge>
        );
    }

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
