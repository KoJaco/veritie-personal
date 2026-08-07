import { Suspense } from "react";

import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeaderContractReset } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import {
    getAspectLensFromSearchParams,
    type SearchParamRecord,
} from "@/lib/aspect-lens";
import {
    getStringParam,
    parseCaptureStatus,
    parseCapturesSortBy,
    parseCapturesView,
    parseEndDateParam,
    parseSortDir,
    parseStartDateParam,
} from "@/lib/route/search-params";
import { CapturesListSkeleton } from "./_components/CapturesListSkeleton";
import { CapturesPageData } from "./_components/CapturesPageData";
import { CapturesPageHeader } from "./_components/CapturesPageHeader";

interface CapturesPageProps {
    searchParams: Promise<SearchParamRecord>;
}

function buildCapturesContractResetKey({
    aspect,
    search,
    status,
    sortBy,
    sortDir,
    view,
    startDate,
    endDate,
}: {
    aspect: string;
    search?: string;
    status?: string;
    sortBy: string;
    sortDir: string;
    view: string;
    startDate?: string;
    endDate?: string;
}) {
    return [
        aspect,
        search ?? "",
        status ?? "",
        sortBy,
        sortDir,
        view,
        startDate ?? "",
        endDate ?? "",
    ].join("|");
}

export default async function CapturesPage({ searchParams }: CapturesPageProps) {
    const resolved = await searchParams;
    const lens = getAspectLensFromSearchParams(resolved);
    const search = getStringParam(resolved.q);
    const status = parseCaptureStatus(getStringParam(resolved.status));
    const sortBy = parseCapturesSortBy(getStringParam(resolved.sortBy));
    const sortDir = parseSortDir(getStringParam(resolved.sortDir));
    const view = parseCapturesView(getStringParam(resolved.view));
    const startDate = parseStartDateParam(getStringParam(resolved.startDate));
    const endDate = parseEndDateParam(getStringParam(resolved.endDate));
    const contractResetKey = buildCapturesContractResetKey({
        aspect: lens.aspect,
        search,
        status,
        sortBy,
        sortDir,
        view,
        startDate,
        endDate,
    });

    return (
        <>
            <ContextPayloadSlot payload={null} />
            <PageHeaderContractReset resetKey={contractResetKey} />
            <PageFrame
                header={
                    <CapturesPageHeader
                        aspect={lens.aspect}
                        search={search}
                        status={status}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        view={view}
                        startDate={startDate}
                        endDate={endDate}
                    />
                }
            >
                <Suspense
                    fallback={<CapturesListSkeleton view={view} />}
                >
                    <CapturesPageData
                        aspect={lens.aspect}
                        search={search}
                        status={status}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        view={view}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </Suspense>
            </PageFrame>
        </>
    );
}
