import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type ScopeLens } from "@/lib/lens";
import { buildAttachmentContextHref } from "@/lib/work/attachment-routes";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format/date";
import { MoveRight } from "lucide-react";

type ObjectSupportingAttachmentItem = {
    id: string;
    title: string;
    kind: string;
    currentVersionNumber: number;
    validUntil?: string;
};

type ObjectSupportingAttachmentsSectionProps = {
    lens: ScopeLens;
    items: ObjectSupportingAttachmentItem[];
};

export function ObjectSupportingAttachmentsSection({
    lens,
    items,
}: ObjectSupportingAttachmentsSectionProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold">
                        Supporting Attachments
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Supporting files related to this document.
                    </p>
                </div>
            </div>

            <div className={cn(SURFACE_CLASS, "p-4")}>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No supporting attachments are linked to this document yet.
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
                                <div>
                                    <span className="text-foreground capitalize">
                                        {item.title}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/50 mt-1.5">
                                        <span className="uppercase flex items-center gap-1">
                                            <span className="w-1 h-1 bg-foreground/50 flex rounded-full" />
                                            {item.kind}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-1 h-1 bg-foreground/50 flex rounded-full" />
                                            v{item.currentVersionNumber}
                                        </span>
                                        <span className="capitalize flex items-center gap-1">
                                            <span className="w-1 h-1 bg-foreground/50 flex rounded-full" />
                                            Valid until{" "}
                                            {item.validUntil
                                                ? formatShortDate(
                                                      item.validUntil,
                                                  )
                                                : "—"}
                                        </span>
                                    </div>
                                </div>

                                <Button variant="ghost" size="sm" asChild>
                                    <Link
                                        href={buildAttachmentContextHref(
                                            item.id,
                                            lens,
                                        )}
                                    >
                                        Open attachment
                                        <MoveRight />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
