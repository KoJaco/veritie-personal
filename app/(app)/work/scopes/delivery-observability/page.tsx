import Link from "next/link";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Button } from "@/components/ui/button";
import { CoverageTimelineClient } from "./_components/CoverageTimelineClient";
import {
    getLensFromSearchParams,
    normalizeLens,
    withLens,
    type ScopeLens,
    type SearchParamRecord,
} from "@/lib/lens";
import { buildScopesRouteContract } from "../_page-model/build";
import { enforceScopesRouteContract } from "../_page-model/validate";
import { ScopeSection } from "../_components/ScopeShared";
import { ScopeChecksTable } from "../_components/CheckInspection";
import { getDataSourceAdapters } from "@/lib/data-source";

interface DeliveryObservabilityPageProps {
    searchParams: Promise<SearchParamRecord>;
}

function toDeliveryObservabilityLens(lens: ScopeLens): ScopeLens {
    if (lens.scope === "delivery-observability") {
        return lens;
    }
    return normalizeLens({ scope: "delivery-observability" });
}

export default async function DeliveryObservabilityPage({
    searchParams,
}: DeliveryObservabilityPageProps) {
    const dataSource = getDataSourceAdapters();
    const lens = getLensFromSearchParams(await searchParams);
    const initialLens = toDeliveryObservabilityLens(lens);
    const documentsHref = withLens("/work/documents", initialLens);
    const tasksHref = withLens("/work/tasks", initialLens);
    const checks = dataSource.checks.getChecksForScope(
        { scopeId: "delivery-observability" },
        8,
    );

    const contract = buildScopesRouteContract({
        scope: "scopes_delivery_observability",
        lens: initialLens,
    });
    const { payload } = enforceScopesRouteContract(contract);

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={
                    <PageHeader
                        title="Delivery Observability"
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
                    <CoverageTimelineClient />
                    <ScopeSection
                        title="Checks"
                        description="Inspect operating coverage, related tasks, and attachments for this operating scope."
                    >
                        <ScopeChecksTable
                            checks={checks.items}
                            lens={initialLens}
                            scope={{ scopeId: "delivery-observability" }}
                        />
                    </ScopeSection>
                </div>
            </PageFrame>
        </>
    );
}
