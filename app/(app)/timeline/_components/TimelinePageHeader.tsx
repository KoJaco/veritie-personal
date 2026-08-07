"use client";

import { IndexSearchCommand, PageHeader, usePageHeaderContract } from "@/components/route";
import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import type { AspectId } from "@/lib/domain/aspect";
import type { TimelineEventType } from "@/lib/domain/timeline";
import type { ReviewState } from "@/lib/domain/extraction";
import { TimelineFilterSheet } from "./TimelineFilterSheet";

type TimelinePageHeaderProps = {
    aspect: AspectId;
    search?: string;
    eventType?: TimelineEventType;
    reviewState?: ReviewState;
    startDate?: string;
    endDate?: string;
};

export function TimelinePageHeader({
    aspect,
    search,
    eventType,
    reviewState,
    startDate,
    endDate,
}: TimelinePageHeaderProps) {
    const { canOpenAssistant, searchItems, suggestionsReady } =
        usePageHeaderContract();

    return (
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
                            aspect,
                            type: eventType,
                            review: reviewState,
                            startDate,
                            endDate,
                        }}
                        items={searchItems}
                        suggestionsReady={suggestionsReady}
                        dialogTitle="Search timeline"
                        dialogDescription="Search timeline events by title, summary, or type."
                        placeholder="Search timeline…"
                        recentHeading="Recent events"
                        matchingHeading="Matching events"
                    />
                    <TimelineFilterSheet
                        aspect={aspect}
                        search={search}
                        eventType={eventType}
                        reviewState={reviewState}
                        startDate={startDate}
                        endDate={endDate}
                    />
                    <PageAssistantAction canOpenAssistant={canOpenAssistant} />
                </>
            }
        />
    );
}
