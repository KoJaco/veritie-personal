import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format/date";
import { withLens, type ScopeLens } from "@/lib/lens";
import { buildAttachmentContextHref } from "@/lib/work/attachment-routes";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { FileText, MoveRight } from "lucide-react";

type TaskAttachmentsSectionItem = {
    id: string;
    title: string;
    kind: string;
    currentVersionNumber: number;
    validUntil?: string;
    status: "draft" | "active" | "superseded" | "archived";
};

type TaskAttachmentsSectionProps = {
    taskId: string;
    taskTitle: string;
    lens: ScopeLens;
    items: TaskAttachmentsSectionItem[];
    actions?: ReactNode;
    emptyStateDescription?: string;
};

export function TaskAttachmentsSection({
    taskId,
    lens,
    items,
    actions,
    emptyStateDescription,
}: TaskAttachmentsSectionProps) {
    return (
        <section>
            <div className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-2 text-base font-semibold">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Attachments
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Supporting files attached while completing this task.
                        </p>
                    </div>
                    {actions}
                </div>

                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {emptyStateDescription ??
                            "No attachments are linked to this task yet."}
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between",
                                    SURFACE_CLASS_NESTED,
                                )}
                            >
                                <div className="flex flex-col gap-1.5">
                                    <Link
                                        href={withLens(
                                            `/work/tasks/${taskId}`,
                                            lens,
                                        )}
                                        className="text-sm font-medium capitalize hover:text-primary"
                                    >
                                        {item.title}
                                    </Link>
                                    <div className="flex flex-wrap items-center text-xs text-foreground/50 gap-x-3">
                                        <span className="uppercase">
                                            {item.kind}
                                        </span>
                                        <span className="w-1 h-1 flex rounded-full bg-foreground/50" />
                                        <span>
                                            v{item.currentVersionNumber}
                                        </span>
                                        <span className="w-1 h-1 flex rounded-full bg-foreground/50" />
                                        <span>
                                            Valid until{" "}
                                            {item.validUntil
                                                ? formatShortDate(
                                                      item.validUntil,
                                                  )
                                                : "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <StatusBadge status={item.status} />
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={withLens(
                                                `/work/tasks/${taskId}`,
                                                lens,
                                            )}
                                        >
                                            Open attachment
                                            <MoveRight />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function StatusBadge({
    status,
}: {
    status: "draft" | "active" | "superseded" | "archived";
}) {
    if (status === "active") {
        return (
            <Badge
                variant="outline"
                className="border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
            >
                Active
            </Badge>
        );
    }

    if (status === "draft") {
        return (
            <Badge
                variant="outline"
                className="border-amber-300/70 text-amber-700 dark:text-amber-400"
            >
                Draft
            </Badge>
        );
    }

    if (status === "superseded") {
        return <Badge variant="secondary">Superseded</Badge>;
    }

    return <Badge variant="secondary">Archived</Badge>;
}
