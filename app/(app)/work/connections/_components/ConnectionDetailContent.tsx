import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/format/date";
import type {
    ConnectionDetailReadModel,
    ConnectionProviderOptionReadModel,
} from "@/lib/data-source";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { ConnectionDetailActions } from "./ConnectionDetailActions";

export function ConnectionDetailContent({
    detail,
}: {
    detail: ConnectionDetailReadModel;
}) {
    return (
        <div className="space-y-12 py-4">
            <section className="space-y-4">
                <h2 className="text-base font-semibold">Overview</h2>
                <div className={cn(SURFACE_CLASS, "p-4 space-y-3")}>
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={detail.status} />
                        <HealthBadge status={detail.healthStatus} />
                        <Badge variant="secondary">
                            Auth via {detail.authType.replace("_", " ")}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {detail.coverageSummary}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatPill
                            variant="nested"
                            label="Last sync"
                            value={
                                detail.lastSyncedAt
                                    ? formatShortDate(detail.lastSyncedAt)
                                    : "No sync yet"
                            }
                        />
                        <StatPill
                            variant="nested"
                            label="Connected"
                            value={
                                detail.connectedAt
                                    ? formatShortDate(detail.connectedAt)
                                    : "Not connected"
                            }
                        />
                        <StatPill
                            variant="nested"
                            label="Automated checks"
                            value={String(detail.automatedChecks)}
                        />
                        <StatPill
                            variant="nested"
                            label="Manual checks remaining"
                            value={String(detail.manualChecksRemaining)}
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div>
                    <h2 className="text-base font-semibold">Sync status</h2>
                    <p className="text-sm text-muted-foreground">
                        {detail.healthStatus === "error"
                            ? (detail.lastError ??
                              "This connection is currently failing and needs operator attention.")
                            : detail.healthStatus === "warning"
                              ? (detail.lastError ??
                                "This connection is partially degraded but still delivering useful state.")
                              : "The latest sync completed without a blocking provider error."}
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <StatPill label="Health" value={detail.healthStatus} />
                    <StatPill
                        label="Failing resources"
                        value={String(detail.failingResourceCount ?? 0)}
                    />
                </div>
            </section>

            <section className="space-y-3">
                <div>
                    <h2 className="text-base font-semibold">
                        Coverage and scopes
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {detail.impactSummary}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {detail.capabilities.map((capability) => (
                            <Badge key={capability} variant="secondary">
                                {capability}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
                    {detail.recommendedScopes.map((scope) => (
                        <div
                            key={scope}
                            className={cn(
                                SURFACE_CLASS,
                                "flex items-center justify-between gap-3 p-4 min-h-16",
                            )}
                        >
                            <span className="text-sm font-medium">{scope}</span>
                            <Badge variant="outline">Scope</Badge>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-base font-semibold">Generated attachments</h2>
                <div className="space-y-3">
                    {detail.generatedAttachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className={cn(
                                SURFACE_CLASS,
                                "p-4 flex items-center justify-between gap-4",
                            )}
                        >
                            <div className="space-y-1">
                                <p className="font-medium">{attachment.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    Generated from {detail.label} sync state for
                                    check-linked attachment refresh.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                    {attachment.status}
                                </Badge>
                                <Link
                                    href={attachment.href}
                                    className="text-sm font-medium underline underline-offset-4"
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-base font-semibold">
                    Settings / danger zone
                </h2>
                <div className="grid gap-4 xl:grid-cols-2">
                    <div className={cn(SURFACE_CLASS, "p-5 space-y-2")}>
                        <p className="font-medium">Connection account</p>
                        <p className="text-sm text-muted-foreground">
                            {detail.externalAccountLabel ??
                                "No external account label recorded."}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Connected by {detail.connectedByName ?? "unknown operator"}.
                        </p>
                    </div>
                    <div
                        className={cn(
                            SURFACE_CLASS,
                            "p-5 space-y-2 border-rose-300/40",
                        )}
                    >
                        <p className="font-medium">Operational caution</p>
                        <p className="text-sm text-muted-foreground">
                            Disconnecting this provider can pause attachment
                            refresh and increase manual check upkeep until the
                            integration is restored.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export function ConnectionDetailHeaderActions({
    detail,
    provider,
}: {
    detail: ConnectionDetailReadModel;
    provider: ConnectionProviderOptionReadModel;
}) {
    return <ConnectionDetailActions detail={detail} provider={provider} />;
}

function StatPill({
    label,
    value,
    variant = "default",
}: {
    label: string;
    value: string;
    variant?: "default" | "nested";
}) {
    return (
        <div
            className={cn(
                variant === "nested" ? SURFACE_CLASS_NESTED : SURFACE_CLASS,
                "p-3 space-y-1",
            )}
        >
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {label}
            </p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const className =
        status === "connected"
            ? "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
            : status === "error" || status === "revoked"
              ? "border-rose-300/70 text-rose-700 dark:text-rose-400"
              : "border-border text-muted-foreground";

    return (
        <Badge variant="outline" className={className}>
            {status.replace("_", " ")}
        </Badge>
    );
}

function HealthBadge({ status }: { status: string }) {
    const className =
        status === "healthy"
            ? "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
            : status === "warning"
              ? "border-amber-300/70 text-amber-700 dark:text-amber-400"
              : status === "error"
                ? "border-rose-300/70 text-rose-700 dark:text-rose-400"
                : "border-border text-muted-foreground";

    return (
        <Badge variant="outline" className={className}>
            {status}
        </Badge>
    );
}
