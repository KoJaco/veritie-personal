import { buildRailPayload } from "@/components/context/build-rail-payload";
import type { RailContextPayload } from "@/components/context/types";
import type { TimelineIndexReadModel } from "@/lib/data-source";
import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";

export type TimelineRouteContract = {
    pageModel: PageModel;
    railPayloadCandidate: RailContextPayload | null;
};

export function buildTimelineRouteContract({
    lens,
    timelineIndex,
}: {
    lens: ScopeLens;
    timelineIndex: TimelineIndexReadModel;
}): TimelineRouteContract {
    const pageModel: PageModel = {
        meta: {
            title: "Timeline",
            description: "Everything captured and extracted, in order.",
            breadcrumbs: [{ label: "Timeline" }],
            aspect: { aspectId: lens.scope },
        },
        view: {
            key: "timeline_index",
            featureFlags: {
                hasAspectFilter: lens.scope !== "all",
            },
        },
        refs: {
            visible: timelineIndex.items.slice(0, 12).map((item) => ({
                kind: "timeline_event",
                id: item.id,
                title: item.title,
                summary: item.type,
            })),
        },
        sections: [
            {
                key: "timeline_summary",
                title: "Timeline summary",
                kind: "metrics_grid",
                items: [
                    {
                        kind: "metric",
                        id: "event_count",
                        summary: String(timelineIndex.total),
                    },
                ],
            },
        ],
        capabilities: {
            canFilterTimeline: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: ["assistant/open", "context/toggleRail"],
        },
    };

    return {
        pageModel,
        railPayloadCandidate: buildRailPayload({
            scope: { type: "timeline" },
            lens,
            aggregates: {
                snapshot: {
                    blockedChecks: 0,
                    overdueTasks: 0,
                    missingAttachments: 0,
                },
            },
        }),
    };
}
