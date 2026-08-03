"use client";

import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatShortDate } from "@/lib/format/date";
import type { ActivityStub } from "@/lib/stubs";
import type { ScopeLens } from "@/lib/lens";
import { getActorAvatarToneClass, getActorInitials } from "@/lib/ui/avatars";
import { cn } from "@/lib/utils";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { buildDashboardEntityHref } from "../_lib/storyRoutes";

export function ActivitySignals({
    signals,
    lens,
}: {
    signals: ActivityStub[];
    lens: ScopeLens;
}) {
    return (
        <section className="space-y-4 pb-2">
            <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    Activity Signals
                </h2>
                <p className="text-sm text-muted-foreground">
                    Readable changes that affect operational execution.
                </p>
            </div>

            <div className="space-y-1.5">
                {signals.map((signal) => (
                    <div
                        key={signal.id}
                        className={`${SURFACE_CLASS} flex items-start justify-between gap-4 p-4`}
                    >
                        <div className="min-w-0 flex items-start gap-3">
                            <Avatar size="sm" className="ring-1 ring-border">
                                <AvatarFallback
                                    className={cn(
                                        "text-[10px] font-semibold uppercase",
                                        getActorAvatarToneClass(
                                            signal.actor.name,
                                        ),
                                    )}
                                >
                                    {getActorInitials(signal.actor.name)}
                                </AvatarFallback>
                            </Avatar>

                            <p className="text-sm leading-6 text-foreground/90">
                                <span className="font-medium text-foreground">
                                    {signal.actor.name}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                    {toActivityActionPrefix(signal)}{" "}
                                </span>
                                <Link
                                    href={buildDashboardEntityHref(
                                        {
                                            type: signal.target.type,
                                            id: signal.target.id,
                                        },
                                        lens,
                                    )}
                                    className="font-medium text-foreground hover:underline"
                                >
                                    {signal.target.title}
                                </Link>
                                <span className="text-muted-foreground">
                                    {toActivityActionSuffix(signal)}
                                </span>
                            </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                            {formatShortDate(signal.timestamp)}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function toActivityActionPrefix(activity: ActivityStub): string {
    switch (activity.type) {
        case "attachment_uploaded":
            return "uploaded";
        case "artifact_version_created":
            return "updated";
        case "task_status_changed":
            return "changed the status of";
        case "task_completed":
            return "completed";
        default:
            return "updated";
    }
}

function toActivityActionSuffix(activity: ActivityStub): string {
    switch (activity.type) {
        case "attachment_uploaded":
            return " attachment.";
        case "artifact_version_created":
            return " to a new version.";
        default:
            return ".";
    }
}
