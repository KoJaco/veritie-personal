import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { IndexSearchCommand, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import type { TimelineEventType } from "@/lib/domain/timeline";
import { TIMELINE_SIGNAL_EVENT_TYPES } from "@/lib/domain/timeline-filters";
import { getDataSourceAdapters } from "@/lib/data-source";
import {
    getAspectLensFromSearchParams,
    type SearchParamRecord,
} from "@/lib/aspect-lens";
import { logger } from "@/lib/logging/server-logger";
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
    const search = getString(resolved.q);
    const eventType = parseEventType(getString(resolved.type));
    const reviewState = parseReviewState(getString(resolved.review));

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

    const detailsById: Record<
        string,
        NonNullable<ReturnType<typeof dataSource.timeline.getTimelineEventDetail>>
    > = {};
    const capturesById: Record<
        string,
        NonNullable<ReturnType<typeof dataSource.captures.getCaptureDetail>>
    > = {};

    for (const item of timelineIndex.items.slice(0, 40)) {
        const detail = dataSource.timeline.getTimelineEventDetail(item.id);
        if (detail) detailsById[item.id] = detail;
        if (item.captureId && !capturesById[item.captureId]) {
            const capture = dataSource.captures.getCaptureDetail(item.captureId);
            if (capture) capturesById[item.captureId] = capture;
        }
    }

    const timelineSearchItems = timelineIndex.items.map((item) => ({
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
                    <TimelineClientView
                        items={timelineIndex.items}
                        detailsById={detailsById}
                        capturesById={capturesById}
                    />
                </div>
            </PageFrame>
        </>
    );
}

function getString(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

function parseEventType(value: string | undefined): TimelineEventType | undefined {
    if (!value) return undefined;
    return TIMELINE_SIGNAL_EVENT_TYPES.includes(value as TimelineEventType)
        ? (value as TimelineEventType)
        : undefined;
}

function parseReviewState(
    value: string | undefined,
): "pending" | "confirmed" | "rejected" | "edited" | undefined {
    if (
        value === "pending" ||
        value === "confirmed" ||
        value === "rejected" ||
        value === "edited"
    ) {
        return value;
    }
    return undefined;
}
