import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type {
    CheckDetailReadModel,
    CheckScope,
    CheckSummaryReadModel,
} from "@/lib/data-source";
import { checkDetailHref } from "@/lib/data-source";
import { formatShortDate } from "@/lib/format/date";
import { withLens, type ScopeLens } from "@/lib/lens";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { MoveRight } from "lucide-react";

type ScopeChecksTableProps = {
    checks: CheckSummaryReadModel[];
    lens: ScopeLens;
    scope: CheckScope;
};

type CheckRelatedAttachmentsSectionProps = {
    items: CheckDetailReadModel["relatedAttachments"];
    lens: ScopeLens;
};

type CheckRelatedTasksSectionProps = {
    items: CheckDetailReadModel["relatedTasks"];
    lens: ScopeLens;
};

export function ScopeChecksTable({
    checks,
    lens,
    scope,
}: ScopeChecksTableProps) {
    return (
        <div className={cn(SURFACE_CLASS, "p-2")}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Check</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Readiness</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead>Attachments</TableHead>
                        <TableHead>Missing attachments</TableHead>
                        <TableHead>Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {checks.map((check, index) => (
                        <TableRow key={`${check.id}-${index}`}>
                            <TableCell>
                                <Link
                                    href={withLens(
                                        getCheckDetailHref(scope, check.id),
                                        lens,
                                    )}
                                    className="font-medium hover:text-primary"
                                >
                                    {check.title}
                                </Link>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {check.summary}
                                </p>
                            </TableCell>
                            <TableCell>{check.domain}</TableCell>
                            <TableCell>
                                <CheckReadinessBadge
                                    readiness={check.readiness}
                                />
                            </TableCell>
                            <TableCell>{check.linkedTasksCount}</TableCell>
                            <TableCell>{check.linkedAttachmentCount}</TableCell>
                            <TableCell>
                                {check.missingAttachmentCount}
                            </TableCell>
                            <TableCell>
                                {formatShortDate(check.updatedAt)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function CheckReadinessBadge({
    readiness,
}: {
    readiness: CheckSummaryReadModel["readiness"];
}) {
    if (readiness === "complete") {
        return (
            <Badge
                variant="outline"
                className="border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
            >
                Complete
            </Badge>
        );
    }

    if (readiness === "blocked") {
        return (
            <Badge
                variant="outline"
                className="border-rose-300/70 text-rose-700 dark:text-rose-400"
            >
                Blocked
            </Badge>
        );
    }

    if (readiness === "at_risk") {
        return (
            <Badge
                variant="outline"
                className="border-amber-300/70 text-amber-700 dark:text-amber-400"
            >
                At risk
            </Badge>
        );
    }

    return <Badge variant="secondary">Unmapped</Badge>;
}

export function CheckReadinessSummary({
    check,
}: {
    check: CheckDetailReadModel;
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-base font-semibold">Readiness</h2>
                <p className="text-sm text-muted-foreground">
                    Inspection summary for the current operating scope.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                <div className={cn(SURFACE_CLASS, "p-4")}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Status
                    </p>
                    <div className="mt-2">
                        <CheckReadinessBadge readiness={check.readiness} />
                    </div>
                </div>
                <div className={cn(SURFACE_CLASS, "p-4")}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Related tasks
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                        {check.linkedTasksCount}
                    </p>
                </div>
                <div className={cn(SURFACE_CLASS, "p-4")}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Related attachments
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                        {check.linkedAttachmentCount}
                    </p>
                </div>
                <div className={cn(SURFACE_CLASS, "p-4")}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Missing attachments
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                        {check.missingAttachmentCount}
                    </p>
                </div>
            </div>
        </section>
    );
}

export function CheckRelatedAttachmentsSection({
    items,
    lens,
}: CheckRelatedAttachmentsSectionProps) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-base font-semibold">Related Attachments</h2>
                <p className="text-sm text-muted-foreground">
                    Read-only attachment relationships derived from existing mappings.
                </p>
            </div>

            <div className={cn(SURFACE_CLASS, "p-4")}>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No attachments are related to this check yet.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex flex-col gap-1.5 rounded-lg border p-3 md:flex-row md:items-center md:justify-between",
                                    SURFACE_CLASS_NESTED,
                                )}
                            >
                                <div className="space-y-1">
                                    <Link
                                        href={withLens(
                                            `/work/documents`,
                                            lens,
                                        )}
                                        className="capitalize text-sm font-medium hover:text-primary"
                                    >
                                        {item.title}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span>
                                            v{item.currentVersionNumber}
                                        </span>
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
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {item.status}
                                    </Badge>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={withLens(
                                            `/work/documents`,
                                            lens,
                                        )}
                                    >
                                            Open documents
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

export function CheckRelatedTasksSection({
    items,
    lens,
}: CheckRelatedTasksSectionProps) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-base font-semibold">Related Tasks</h2>
                <p className="text-sm text-muted-foreground">
                    Work items currently linked to this check.
                </p>
            </div>

            <div className={cn(SURFACE_CLASS, "p-4")}>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No tasks are linked to this check yet.
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
                                <div className="space-y-1">
                                    <Link
                                        href={withLens(
                                            `/work/tasks/${item.id}`,
                                            lens,
                                        )}
                                        className="capitalize text-sm font-medium hover:text-primary"
                                    >
                                        {item.title}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="capitalize">
                                            {item.status.replace("_", " ")}
                                        </span>
                                        <span className="capitalize">
                                            {item.priority}
                                        </span>
                                        <span>
                                            Due{" "}
                                            {item.dueAt
                                                ? formatShortDate(item.dueAt)
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link
                                        href={withLens(
                                            `/work/tasks/${item.id}`,
                                            lens,
                                        )}
                                    >
                                        Open task
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

export function getCheckDetailHref(
    scope: CheckScope,
    checkId: string,
): string {
    return checkDetailHref(scope, checkId);
}
