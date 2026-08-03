import type { ScopeLens } from "@/lib/lens";
import type { PageModel } from "@/lib/page-model/types";
import type { CapturesIndexReadModel } from "@/lib/data-source/captures-read-model";

export type CapturesRouteContract = {
    pageModel: PageModel;
};

export function buildCapturesRouteContract({
    lens,
    capturesIndex,
}: {
    lens: ScopeLens;
    capturesIndex: CapturesIndexReadModel;
}): CapturesRouteContract {
    const pageModel: PageModel = {
        meta: {
            title: "Captures",
            description: "Voice logs and uploaded sources.",
            breadcrumbs: [{ label: "Captures" }],
            aspect: { aspectId: lens.scope },
        },
        view: {
            key: "captures_index",
            featureFlags: {
                hasAspectFilter: lens.scope !== "all",
            },
        },
        refs: {
            visible: capturesIndex.items.slice(0, 12).map((item) => ({
                kind: "capture",
                id: item.id,
                title: item.title,
                summary: item.type,
            })),
        },
        sections: [
            {
                key: "captures_summary",
                title: "Captures summary",
                kind: "metrics_grid",
                items: [
                    {
                        kind: "metric",
                        id: "capture_count",
                        summary: String(capturesIndex.total),
                    },
                ],
            },
        ],
        capabilities: {
            canFilterCaptures: true,
            canOpenLensDialog: true,
            canUseContextRail: true,
        },
        actions: {
            available: ["assistant/open", "context/toggleRail"],
        },
    };

    return { pageModel };
}

export function canOpenAssistantFromCapturesContract(
    contract: CapturesRouteContract,
): boolean {
    return contract.pageModel.actions.available.includes("assistant/open");
}
