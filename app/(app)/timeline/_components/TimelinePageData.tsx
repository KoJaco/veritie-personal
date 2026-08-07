import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeaderContractHydrator } from "@/components/route";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { AspectId } from "@/lib/domain/aspect";
import type { TimelineEventType } from "@/lib/domain/timeline";
import type { ReviewState } from "@/lib/domain/extraction";
import { logger } from "@/lib/logging/server-logger";
import { INDEX_SEARCH_SUGGESTION_LIMIT } from "@/lib/route/search-params";
import { buildTimelineRouteContract } from "../_page-model/build";
import { enforceTimelineRouteContract } from "../_page-model/validate";
import { TimelineClientView } from "./TimelineClientView";

type TimelinePageDataProps = {
    aspect: AspectId;
    search?: string;
    eventType?: TimelineEventType;
    reviewState?: ReviewState;
    startDate?: string;
    endDate?: string;
};

export async function TimelinePageData({
    aspect,
    search,
    eventType,
    reviewState,
    startDate,
    endDate,
}: TimelinePageDataProps) {
    const scopeLens = { scope: aspect };
    const dataSource = getDataSourceAdapters();
    const timelineIndex = await dataSource.timeline.getTimelineIndex({
        lens: scopeLens,
        search: search || undefined,
        eventTypes: eventType ? [eventType] : undefined,
        reviewStates: reviewState ? [reviewState] : undefined,
        startDate,
        endDate,
    });

    const glossaryLabels =
        await dataSource.pipeline.getExtractionGlossaryLabels();

    const contract = buildTimelineRouteContract({
        lens: scopeLens,
        timelineIndex,
    });
    const { pageModelValidation, payload } =
        enforceTimelineRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/timeline",
        ok: pageModelValidation.ok,
    });

    const timelineSearchItems = timelineIndex.items
        .slice(0, INDEX_SEARCH_SUGGESTION_LIMIT)
        .map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            searchTerms: [item.type.replace(/_/g, " ")],
        }));

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageHeaderContractHydrator
                canOpenAssistant={contract.pageModel.actions.available.includes(
                    "assistant/open",
                )}
                searchItems={timelineSearchItems}
            />
            <div className="space-y-6 py-4">
                <TimelineClientView
                    items={timelineIndex.items}
                    glossaryLabels={glossaryLabels}
                />
            </div>
        </>
    );
}
