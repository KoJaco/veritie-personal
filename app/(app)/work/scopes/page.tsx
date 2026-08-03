import Link from "next/link";
import { ArrowRight, Shapes } from "lucide-react";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Button } from "@/components/ui/button";
import {
    getLensParseResultFromSearchParams,
    SCOPE_DEFINITIONS,
    type SearchParamRecord,
    withLens,
} from "@/lib/lens";
import { buildScopesRouteContract } from "./_page-model/build";
import { enforceScopesRouteContract } from "./_page-model/validate";
import { logger } from "@/lib/logging/server-logger";
import { SURFACE_CLASS } from "@/lib/ui/surface";

interface ScopesPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function ScopesPage({ searchParams }: ScopesPageProps) {
    const resolvedSearchParams = await searchParams;
    const lensParseResult =
        getLensParseResultFromSearchParams(resolvedSearchParams);
    const lens = lensParseResult.lens;

    if (lensParseResult.issues.length > 0) {
        logger.warn("[lens] query_rejected", {
            route: "/work/scopes",
            issueCodes: lensParseResult.issues,
            issueCount: lensParseResult.issues.length,
            inputSizeBytes: lensParseResult.inputSizeBytes,
        });
    }

    const contract = buildScopesRouteContract({
        scope: "scopes_index",
        lens,
    });
    const { payload } = enforceScopesRouteContract(contract);

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame header={<PageHeader title="Scopes" separator={false} />}>
                <div className="space-y-8 py-4">
                    <div className={SURFACE_CLASS + " p-5"}>
                        <p className="text-sm text-muted-foreground">
                            Scopes are the reusable operating contexts applied across work,
                            documents, resources, and checks.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {SCOPE_DEFINITIONS.map((scope) => (
                            <div key={scope.id} className={SURFACE_CLASS + " p-5 space-y-4"}>
                                <div className="flex items-start gap-3">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Shapes className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-semibold">
                                            {scope.label}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {scope.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button asChild size="sm">
                                        <Link href={withLens(`/work/scopes/${scope.id}`, { scope: scope.id })}>
                                            Open scope
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={withLens("/work/tasks", { scope: scope.id })}>
                                            View tasks
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageFrame>
        </>
    );
}
