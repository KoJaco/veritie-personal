import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import {
    ScopeSection,
    PlaceholderStatGrid,
} from "../_components/ScopeShared";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    getLensFromSearchParams,
    normalizeLens,
    withLens,
    type ScopeLens,
    type SearchParamRecord,
} from "@/lib/lens";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { buildScopesRouteContract } from "../_page-model/build";
import { enforceScopesRouteContract } from "../_page-model/validate";
import { cn } from "@/lib/utils";
import { ScopeChecksTable } from "../_components/CheckInspection";
import { getDataSourceAdapters } from "@/lib/data-source";

interface WorkspaceResiliencePageProps {
    searchParams: Promise<SearchParamRecord>;
}

function toWorkspaceResilienceLens(lens: ScopeLens): ScopeLens {
    if (lens.scope === "workspace-resilience") {
        return lens;
    }
    return normalizeLens({ scope: "workspace-resilience" });
}

export default async function WorkspaceResiliencePage({
    searchParams,
}: WorkspaceResiliencePageProps) {
    const dataSource = getDataSourceAdapters();
    const hasUnmappedChecks = true;
    const lens = toWorkspaceResilienceLens(
        getLensFromSearchParams(await searchParams),
    );
    const checks = dataSource.checks.getChecksForScope(
        { scopeId: "workspace-resilience" },
        8,
    );

    const contract = buildScopesRouteContract({
        scope: "scopes_workspace_resilience",
        lens,
    });
    const { payload } = enforceScopesRouteContract(contract);

    const documentsHref = withLens("/work/documents", lens);
    const tasksHref = withLens("/work/tasks", lens);
    const settingsHref = withLens("/work/settings", lens);

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={
                    <PageHeader
                        title="Workspace Resilience"
                        separator={false}
                        actions={
                            <>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={documentsHref}>
                                        View documents
                                    </Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={tasksHref}>View tasks</Link>
                                </Button>
                            </>
                        }
                    />
                }
            >
                <div className="space-y-12 py-4">
                    {hasUnmappedChecks ? (
                        <div className={cn(SURFACE_CLASS, "p-4")}>
                            <div className="flex items-start gap-3">
                                <div className="aspect-square size-12 rounded-xl dark:bg-amber-700/10 bg-amber-700 border-amber-700 flex items-center justify-center">
                                    <AlertTriangle className="size-6 mt-0.5 text-amber-700" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Unmapped checks detected
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Resilience reporting may be incomplete
                                        until mapping is reviewed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <ScopeSection title="At-a-glance">
                        <PlaceholderStatGrid
                            columnsClassName="md:grid-cols-4"
                            items={[
                                "Overall resilience score",
                                "Focus areas on track",
                                "Focus areas needing attention",
                                "Missing attachments",
                            ]}
                        />
                    </ScopeSection>

                    <ScopeSection title="Resilience focus areas">
                        <div className="space-y-2">
                            {[
                                "Change control discipline",
                                "Patch and update cadence",
                                "Privileged access safeguards",
                                "Application hardening",
                                "Backup and recovery readiness",
                                "Multi-factor authentication",
                                "Messaging and endpoint filtering",
                                "Operational monitoring coverage",
                            ].map((focusArea) => (
                                <div
                                    key={focusArea}
                                    className={`${SURFACE_CLASS} p-4 flex items-center justify-between gap-4`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-foreground">
                                            {focusArea}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Coverage: not assessed yet
                                        </p>
                                    </div>
                                    <Badge variant="outline">Pending</Badge>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link href={tasksHref}>View tasks</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScopeSection>

                    <ScopeSection
                        title="Checks"
                        description="Inspect mapped checks, related tasks, and attachments for this operating scope."
                    >
                        <ScopeChecksTable
                            checks={checks.items}
                            lens={lens}
                            scope={{ scopeId: "workspace-resilience" }}
                        />
                    </ScopeSection>

                    <section className="space-y-8">
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">
                                Highest impact gaps
                            </h3>
                            <div
                                className={`${SURFACE_CLASS} p-4 min-h-30 flex justify-center items-center`}
                            >
                                <p className="text-sm text-muted-foreground">
                                    No high-impact gap tasks are available in
                                    this environment yet.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">
                                Quick wins
                            </h3>
                            <div
                                className={`${SURFACE_CLASS} p-4 min-h-30 flex items-center justify-center`}
                            >
                                <p className="text-sm text-muted-foreground">
                                    No quick-win tasks are available in this
                                    environment yet.
                                </p>
                            </div>
                        </div>
                    </section>

                    <ScopeSection title="Unmapped / gaps">
                        <div
                            className={`${SURFACE_CLASS} ${hasUnmappedChecks ? "border-amber-300/70" : ""} p-4 space-y-3`}
                        >
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={
                                        hasUnmappedChecks
                                            ? "border-amber-300/70 text-amber-700 dark:text-amber-400"
                                            : ""
                                    }
                                >
                                    {hasUnmappedChecks
                                        ? "Unmapped checks detected"
                                        : "Mappings complete"}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {hasUnmappedChecks
                                    ? "Review mapping to improve resilience scoring confidence."
                                    : "No unmapped checks currently detected."}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={settingsHref}>
                                    Review mapping
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </ScopeSection>
                </div>
            </PageFrame>
        </>
    );
}
