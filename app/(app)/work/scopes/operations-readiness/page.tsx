import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import {
    ScopeSection,
    PlaceholderStatGrid,
} from "../_components/ScopeShared";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { AlertTriangle, MoveRight } from "lucide-react";
import Link from "next/link";
import { buildScopesRouteContract } from "../_page-model/build";
import { enforceScopesRouteContract } from "../_page-model/validate";
import { getScopeMappingStatusStub } from "@/lib/stubs";
import { cn } from "@/lib/utils";
import { ScopeChecksTable } from "../_components/CheckInspection";
import { getDataSourceAdapters } from "@/lib/data-source";
import {
    getLensFromSearchParams,
    normalizeLens,
    withLens,
    type ScopeLens,
    type SearchParamRecord,
} from "@/lib/lens";

interface OperationsReadinessPageProps {
    searchParams: Promise<SearchParamRecord>;
}

function toOperationsReadinessLens(lens: ScopeLens): ScopeLens {
    if (lens.scope === "operations-readiness") {
        return lens;
    }
    return normalizeLens({ scope: "operations-readiness" });
}

function getMappingStatus(): "valid" | "invalid" {
    return getScopeMappingStatusStub();
}

export default async function OperationsReadinessPage({
    searchParams,
}: OperationsReadinessPageProps) {
    const dataSource = getDataSourceAdapters();
    const mappingStatus = getMappingStatus();
    const failClosed: boolean = mappingStatus === "invalid";
    const lens = toOperationsReadinessLens(
        getLensFromSearchParams(await searchParams),
    );
    const checks = dataSource.checks.getChecksForScope(
        { scopeId: "operations-readiness" },
        8,
    );

    const contract = buildScopesRouteContract({
        scope: "scopes_operations_readiness",
        lens,
    });
    const { payload } = enforceScopesRouteContract(contract);

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={
                    <PageHeader
                        title="Operations Readiness"
                        separator={false}
                        actions={
                            <>
                                <Button asChild size="sm" variant="outline">
                                    <Link
                                        href={withLens("/work/documents", lens)}
                                    >
                                        View documents
                                    </Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link
                                        href={withLens("/work/tasks", lens)}
                                    >
                                        View tasks
                                    </Link>
                                </Button>
                            </>
                        }
                    />
                }
            >
                <div className="space-y-12 pt-4">
                    {failClosed ? (
                        <div className={cn(SURFACE_CLASS, "p-4")}>
                            <div className="flex items-start gap-3">
                                <div className="aspect-square size-12 rounded-xl dark:bg-amber-700/10 bg-amber-700 border-amber-700 flex items-center justify-center">
                                    <AlertTriangle className="size-6 dark:text-amber-500 text-amber-50" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Scope mapping baseline is invalid
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Readiness interpretation is disabled
                                        until scope check mapping is fixed.
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
                                "Blocked checks",
                                "Overdue tasks",
                                "Missing attachments",
                                "Unmapped checks",
                            ]}
                        />
                        <blockquote
                            className={`${SURFACE_CLASS} rounded-r-xl rounded-l-md border-l-0 p-4 relative`}
                        >
                            <span className="absolute top-0 left-0 h-full w-1 bg-primary rounded-l-md" />
                            <div className="space-y-1">
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Operations readiness reflects a point-in-time
                                    posture across mapped checks.
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Use this view to prioritize blockers before
                                    attachment finalization.
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Immediate recommendation: close blocked
                                    readiness tasks before the next review
                                    window.
                                </p>
                            </div>
                        </blockquote>
                    </ScopeSection>

                    <section className="space-y-12">
                        <ScopeSection
                            title="Checks"
                            description="Inspect readiness, linked tasks, and attachment coverage for this operating scope."
                        >
                            <ScopeChecksTable
                                checks={checks.items}
                                lens={lens}
                                scope={{ scopeId: "operations-readiness" }}
                            />
                        </ScopeSection>

                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">
                                Blocking readiness
                            </h3>
                            <div
                                className={`${SURFACE_CLASS} p-4 min-h-30 flex items-center justify-center`}
                            >
                                <p className="text-sm text-muted-foreground">
                                    No blocking readiness items are available in
                                    this environment yet.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-medium text-foreground">
                                Due soon
                            </h3>
                            <div
                                className={`${SURFACE_CLASS} p-4 min-h-30 flex items-center justify-center`}
                            >
                                <p className="text-sm text-muted-foreground">
                                    No due-soon readiness items are available in
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
                                    No quick-win readiness items are available
                                    in this environment yet.
                                </p>
                            </div>
                        </div>
                    </section>

                    <ScopeSection title="Configuration status">
                        <div className={`${SURFACE_CLASS} p-4 space-y-3`}>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={
                                        failClosed
                                            ? "border-amber-300/70 text-amber-700 dark:text-amber-400"
                                            : "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
                                    }
                                >
                                    Scope mapping:{" "}
                                    {failClosed ? "invalid" : "valid"}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {failClosed
                                    ? "Fail-closed: readiness interpretation is disabled until scope mapping is fixed."
                                    : "Scope mapping configured. Readiness interpretation is enabled."}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link
                                    href={withLens("/work/settings", lens)}
                                >
                                    Open scope configuration
                                    <MoveRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </ScopeSection>
                </div>
            </PageFrame>
        </>
    );
}
