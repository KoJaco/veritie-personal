import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { IndexSearchCommand, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import { getDataSourceAdapters } from "@/lib/data-source";
import {
    getAspectLensFromSearchParams,
    type SearchParamRecord,
} from "@/lib/aspect-lens";
import { logger } from "@/lib/logging/server-logger";
import {
    getStringParam,
    INDEX_SEARCH_SUGGESTION_LIMIT,
    parseReviewState,
    parseTimelineEventType,
} from "@/lib/route/search-params";
import { buildTimelineRouteContract } from "./_page-model/build";
import { enforceTimelineRouteContract } from "./_page-model/validate";
import { TimelineClientView } from "./_components/TimelineClientView";
import { TimelineFilterSheet } from "./_components/TimelineFilterSheet";

interface TimelinePageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
    const resolved = await searchParams;
    const lens = getAspectLensFromSearchParams(resolved);
    const scopeLens = { scope: lens.aspect };
    const search = getStringParam(resolved.q);
    const eventType = parseTimelineEventType(getStringParam(resolved.type));
    const reviewState = parseReviewState(getStringParam(resolved.review));

    const dataSource = getDataSourceAdapters();
    const timelineIndex = dataSource.timeline.getTimelineIndex({
        lens: scopeLens,
        search: search || undefined,
        eventTypes: eventType ? [eventType] : undefined,
        reviewStates: reviewState ? [reviewState] : undefined,
    });

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
            <PageFrame
                header={
                    <PageHeader
                        title="Timeline"
                        description="Search and review captures and extracted signals."
                        separator={false}
                        actions={
                            <>
                                <IndexSearchCommand
                                    route="/timeline"
                                    search={search}
                                    baseParams={{
                                        aspect: lens.aspect,
                                        type: eventType,
                                        review: reviewState,
                                    }}
                                    items={timelineSearchItems}
                                    dialogTitle="Search timeline"
                                    dialogDescription="Search timeline events by title, summary, or type."
                                    placeholder="Search timeline…"
                                    recentHeading="Recent events"
                                    matchingHeading="Matching events"
                                />
                                <TimelineFilterSheet
                                    aspect={lens.aspect}
                                    search={search}
                                    eventType={eventType}
                                    reviewState={reviewState}
                                />
                                <PageAssistantAction
                                    canOpenAssistant={contract.pageModel.actions.available.includes(
                                        "assistant/open",
                                    )}
                                />
                            </>
                        }
                    />
                }
            >
                <div className="space-y-6 py-4">
                    <TimelineClientView items={timelineIndex.items} />
                </div>
            </PageFrame>
        </>
    );
}
