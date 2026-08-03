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

interface KnowledgeHygienePageProps {
    searchParams: Promise<SearchParamRecord>;
}

function toKnowledgeHygieneLens(lens: ScopeLens): ScopeLens {
    if (lens.scope === "knowledge-hygiene") {
        return lens;
    }
    return normalizeLens({ scope: "knowledge-hygiene" });
}

export default async function KnowledgeHygienePage({
    searchParams,
}: KnowledgeHygienePageProps) {
    const dataSource = getDataSourceAdapters();
    const hasConfigurationGaps = true;
    const lens = toKnowledgeHygieneLens(
        getLensFromSearchParams(await searchParams),
    );
    const checks = dataSource.checks.getChecksForScope(
        { scopeId: "knowledge-hygiene" },
        8,
    );

    const contract = buildScopesRouteContract({
        scope: "scopes_knowledge_hygiene",
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
                        title="Knowledge Hygiene"
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
                    {hasConfigurationGaps ? (
                        <div className={cn(SURFACE_CLASS, "p-4")}>
                            <div className="flex items-start gap-3">
                                <div className="flex size-12 items-center justify-center rounded-xl border border-amber-700 bg-amber-700/10">
                                    <AlertTriangle className="size-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Configuration gaps detected
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Knowledge hygiene reporting confidence
                                        improves once the documentation baseline
                                        and check ownership are in place.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <ScopeSection title="At-a-glance">
                        <PlaceholderStatGrid
                            columnsClassName="md:grid-cols-5"
                            items={[
                                "Checks complete",
                                "Open gaps",
                                "Blocked checks",
                                "Missing attachments",
                                "Documents in place",
                            ]}
                        />
                    </ScopeSection>

                    <ScopeSection title="Documentation baseline">
                        <blockquote
                            className={`${SURFACE_CLASS} relative rounded-r-xl rounded-l-md border-l-0 p-4`}
                        >
                            <span className="absolute top-0 left-0 h-full w-1 rounded-l-md bg-primary" />
                            <div className="space-y-1">
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Knowledge hygiene focuses on durable operating
                                    documentation, not just isolated check
                                    completion.
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Use this view to track your baseline
                                    documentation posture, supporting artifacts,
                                    and check readiness.
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Immediate recommendation: establish the core
                                    document baseline and check ownership before
                                    broadening attachment collection.
                                </p>
                            </div>
                        </blockquote>
                    </ScopeSection>

                    <ScopeSection
                        title="Checks"
                        description="Inspect mapped checks, linked tasks, and attachments for this operating scope."
                    >
                        <ScopeChecksTable
                            checks={checks.items}
                            lens={lens}
                            scope={{ scopeId: "knowledge-hygiene" }}
                        />
                    </ScopeSection>

                    <section className="space-y-8">
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">
                                Priority gaps
                            </h3>
                            <div
                                className={`${SURFACE_CLASS} flex min-h-30 items-center justify-center p-4`}
                            >
                                <p className="text-sm text-muted-foreground">
                                    No priority knowledge hygiene gap items are
                                    available in this environment yet.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">
                                Quick wins
                            </h3>
                            <div
                                className={`${SURFACE_CLASS} flex min-h-30 items-center justify-center p-4`}
                            >
                                <p className="text-sm text-muted-foreground">
                                    No knowledge hygiene quick-win tasks are
                                    available in this environment yet.
                                </p>
                            </div>
                        </div>
                    </section>

                    <ScopeSection title="Configuration status">
                        <div className={`${SURFACE_CLASS} space-y-3 p-4`}>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={
                                        hasConfigurationGaps
                                            ? "border-amber-300/70 text-amber-700 dark:text-amber-400"
                                            : "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
                                    }
                                >
                                    Documentation baseline:{" "}
                                    {hasConfigurationGaps
                                        ? "needs setup"
                                        : "configured"}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {hasConfigurationGaps
                                    ? "Review knowledge hygiene mappings and baseline documents before treating posture as review-ready."
                                    : "Knowledge hygiene baseline configuration is in place."}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={settingsHref}>
                                    Open scope configuration
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
