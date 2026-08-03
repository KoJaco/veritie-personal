import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TaskDocumentSummaryReadModel } from "@/lib/data-source";
import { formatRelativeDate } from "@/lib/format/date";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ArrowRight, Boxes } from "lucide-react";

type TaskDocumentsSectionProps = {
    lens: ScopeLens;
    documents: TaskDocumentSummaryReadModel[];
};

export function TaskDocumentsSection({
    lens,
    documents,
}: TaskDocumentsSectionProps) {
    return (
        <section>
            <div className={cn(SURFACE_CLASS, "space-y-3 p-4")}>
                <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        Documents
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Supporting procedures and policies linked to this task.
                    </p>
                </div>

                <div className="space-y-1.5">
                    {documents.map((document) => (
                        <div
                            key={document.id}
                            className={cn(
                                SURFACE_CLASS_NESTED,
                                "flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between",
                            )}
                        >
                            <div className="space-y-1.5">
                                <p className="text-sm font-medium">
                                    {document.title}
                                </p>
                                <p className="text-xs tracking-wide text-foreground/50 flex gap-x-3 items-center capitalize">
                                    <span className="uppercase">
                                        {document.kind.replace("_", " ")}
                                    </span>
                                    <span className="w-1 h-1 flex rounded-full bg-foreground/50" />
                                    updated{" "}
                                    {formatRelativeDate(document.updatedAt)}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={withLens(document.href, lens)}>
                                    View document
                                    <ArrowRight />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
