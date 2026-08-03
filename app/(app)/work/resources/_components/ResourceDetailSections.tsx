import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    resourceCategoryLabel,
    resourceCriticalityLabel,
    resourceSensitivityLabel,
} from "@/lib/resources/labels";
import { formatRelativeDate, formatShortDate } from "@/lib/format/date";
import type { ResourceDetailStub } from "@/lib/stubs";
import { getNormalizedAttachmentSeed } from "@/lib/data-source/stub-normalized-stories";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { getActorAvatarToneClass, getActorInitials } from "@/lib/ui/avatars";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionProps = {
    resource: ResourceDetailStub;
};

function buildResourceAttachmentHref(attachmentId: string): string {
    const seed = getNormalizedAttachmentSeed(attachmentId);
    const taskId = seed?.attachedTaskIds[0];
    return taskId ? `/work/tasks/${taskId}` : "/work/tasks";
}

export function ResourceSummarySection({ resource }: SectionProps) {
    return (
        <section className={`${SURFACE_CLASS} space-y-4 p-5`}>
            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                        {resourceCategoryLabel(resource.category)}
                    </Badge>
                    <Badge variant="outline">
                        {resourceCriticalityLabel(resource.criticality)}
                    </Badge>
                    <Badge variant="outline">
                        Sensitivity: {resourceSensitivityLabel(resource.sensitivity)}
                    </Badge>
                </div>
                <h1 className="text-2xl font-semibold">{resource.name}</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    {resource.summary}
                </p>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    {resource.postureSummary}
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DetailMetric
                    label="Owner"
                    value={resource.owner?.name ?? "Unassigned"}
                />
                <DetailMetric
                    label="Updated"
                    value={formatRelativeDate(resource.updatedAt)}
                />
                <DetailMetric
                    label="Checks linked"
                    value={String(resource.linkedChecksCount)}
                />
                <DetailMetric
                    label="Attachments linked"
                    value={String(resource.linkedAttachmentCount)}
                />
            </div>
        </section>
    );
}

export function LinkedControlsSection({ resource }: SectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold">Linked checks</h2>
            <div className="space-y-1.5">
                {resource.linkedChecks.map((check) => (
                    <Link
                        key={check.id}
                        href={`/work/documents/${check.id}`}
                        className={cn(
                            SURFACE_CLASS,
                            "flex items-center justify-between px-3 py-2 transition-colors hover:bg-background/60",
                        )}
                    >
                        <div>
                            <p className="font-medium">{check.title}</p>
                            <p className="text-sm text-muted-foreground">
                                Explicit scope mapping
                            </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                ))}
            </div>
        </section>
    );
}

export function LinkedTasksSection({ resource }: SectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold">Linked tasks</h2>
            <div className="space-y-1.5">
                {resource.linkedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No task links yet.
                    </p>
                ) : (
                    resource.linkedTasks.map((task) => (
                        <Link
                            key={task.id}
                            href={`/work/tasks/${task.id}`}
                            className={cn(
                                SURFACE_CLASS,
                                "block px-3 py-2 transition-colors hover:bg-background/60",
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {task.status} · {task.priority}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}

export function LinkedAttachmentsSection({ resource }: SectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold">Linked attachments</h2>
            <div className="space-y-1.5">
                {resource.linkedAttachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No attachment links yet.
                    </p>
                ) : (
                    resource.linkedAttachments.map((attachment) => (
                        <Link
                            key={attachment.id}
                            href={buildResourceAttachmentHref(attachment.id)}
                            className={cn(
                                SURFACE_CLASS,
                                "block px-3 py-2 transition-colors hover:bg-background/60",
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {attachment.filename}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {attachment.status}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}

export function ConnectionLinksSection({ resource }: SectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold">Connection links</h2>
            <div className="space-y-1.5">
                {resource.linkedConnections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No connection links yet.
                    </p>
                ) : (
                    resource.linkedConnections.map((connection) => (
                        <Link
                            key={connection.connectionId}
                            href="/work/connections"
                            className={cn(
                                SURFACE_CLASS,
                                "block px-3 py-2 transition-colors hover:bg-background/60",
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {connection.connectionLabel}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        External automation source ·{" "}
                                        {connection.status}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}

export function ResourceTimelineSection({ resource }: SectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold">Timeline</h2>
            <div className="space-y-1.5">
                {resource.timeline.map((event) => (
                    <div
                        key={event.id}
                        className={`${SURFACE_CLASS} flex items-start justify-between gap-4 p-4`}
                    >
                        <div className="min-w-0 flex items-start gap-3">
                            <Avatar size="sm" className="ring-1 ring-border">
                                <AvatarFallback
                                    className={cn(
                                        "text-[10px] font-semibold uppercase",
                                        getActorAvatarToneClass(
                                            event.actor.name,
                                        ),
                                    )}
                                >
                                    {getActorInitials(event.actor.name)}
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-sm leading-6 text-foreground/90">
                                <span className="font-medium text-foreground">
                                    {event.actor.name}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                    {event.summary}
                                </span>
                            </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                            {formatShortDate(event.occurredAt)}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className={`${SURFACE_CLASS_NESTED} px-3 py-3`}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}
