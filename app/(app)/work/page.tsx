import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { SetupActionSection } from "./_components/fresh/SetupActionSection";
import { SetupAreasSection } from "./_components/fresh/SetupAreasSection";
import { SetupOverviewSection } from "./_components/fresh/SetupOverviewSection";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { buildFreshWorkRouteContract } from "./_page-model/build";
import { enforceWorkRouteContract } from "./_page-model/validate";
import {
    getLensParseResultFromSearchParams,
    type SearchParamRecord,
} from "@/lib/lens";
import { logger } from "@/lib/logging/server-logger";
import { buildFreshDashboardModel } from "@/lib/onboarding-stub";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";
import { Clock, TriangleAlert } from "lucide-react";

interface DashboardPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function DashboardPage({
    searchParams,
}: DashboardPageProps) {
    const bootstrap = await getStubServerBootstrap();
    const lensParseResult = getLensParseResultFromSearchParams(
        await searchParams,
    );
    const lens = lensParseResult.lens;

    if (lensParseResult.issues.length > 0) {
        logger.warn("[lens] query_rejected", {
            route: "/work",
            issueCodes: lensParseResult.issues,
            issueCount: lensParseResult.issues.length,
            inputSizeBytes: lensParseResult.inputSizeBytes,
        });
    }
    const now = new Date();
    const freshViewModel = buildFreshDashboardModel(bootstrap.summary, lens);
    const composedContracts = buildFreshWorkRouteContract({
        lens,
        now,
        summary: bootstrap.summary,
    });
    const { pageModelValidation, railPayload } =
        enforceWorkRouteContract(composedContracts);

    logger.debug("[page-model] validation", {
        route: "/work",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/work",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/work",
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes,
        });
    }

    return (
        <>
            <ContextPayloadSlot payload={railPayload} />
            <PageFrame
                header={
                    <PageHeader
                        title="Work"
                        description="Setup-first bootstrap state for a fresh workspace"
                        separator={false}
                    />
                }
            >
                <div className="space-y-12 py-4">
                    <SetupOverviewSection overview={freshViewModel.overview} />
                    <SetupActionSection
                        title="First actions"
                        description="Start with the setup tasks that will make the rest of the workspace meaningful fastest."
                        lens={lens}
                        items={freshViewModel.firstActions}
                        icon={<Clock className="w-4 h-4" />}
                    />
                    <SetupActionSection
                        title="Setup blockers"
                        description="These are the gaps that still stop the workspace from moving beyond a bootstrap state."
                        lens={lens}
                        items={freshViewModel.setupBlockers}
                        tone="warning"
                        icon={<TriangleAlert className="w-4 h-4" />}
                    />
                    <SetupAreasSection
                        areas={freshViewModel.setupAreas}
                        lens={lens}
                    />
                </div>
            </PageFrame>
        </>
    );
}
