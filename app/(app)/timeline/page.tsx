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
    parseReviewState,
    parseTimelineEventType,
} from "@/lib/route/search-params";
import { TimelineListSkeleton } from "./_components/TimelineListSkeleton";
import { TimelinePageData } from "./_components/TimelinePageData";
import { TimelinePageHeader } from "./_components/TimelinePageHeader";

interface TimelinePageProps {
    searchParams: Promise<SearchParamRecord>;
}

function buildTimelineContractResetKey({
    aspect,
    search,
    eventType,
    reviewState,
}: {
    aspect: string;
    search?: string;
    eventType?: string;
    reviewState?: string;
}) {
    return [aspect, search ?? "", eventType ?? "", reviewState ?? ""].join("|");
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
    const resolved = await searchParams;
    const lens = getAspectLensFromSearchParams(resolved);
    const search = getStringParam(resolved.q);
    const eventType = parseTimelineEventType(getStringParam(resolved.type));
    const reviewState = parseReviewState(getStringParam(resolved.review));
    const contractResetKey = buildTimelineContractResetKey({
        aspect: lens.aspect,
        search,
        eventType,
        reviewState,
    });

    return (
        <>
            <ContextPayloadSlot payload={null} />
            <PageHeaderContractReset resetKey={contractResetKey} />
            <PageFrame
                header={
                    <TimelinePageHeader
                        aspect={lens.aspect}
                        search={search}
                        eventType={eventType}
                        reviewState={reviewState}
                    />
                }
            >
                <Suspense fallback={<TimelineListSkeleton />}>
                    <TimelinePageData
                        aspect={lens.aspect}
                        search={search}
                        eventType={eventType}
                        reviewState={reviewState}
                    />
                </Suspense>
            </PageFrame>
        </>
    );
}
