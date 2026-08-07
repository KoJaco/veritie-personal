import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeaderContractHydrator } from "@/components/route";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { AspectId } from "@/lib/domain/aspect";
import type { CaptureStatus } from "@/lib/domain/capture";
import type { IndexViewMode } from "@/components/route/IndexViewToggle";
import { logger } from "@/lib/logging/server-logger";
import { formatExtractedCountLabel } from "@/lib/capture/extraction-summary";
import { INDEX_SEARCH_SUGGESTION_LIMIT } from "@/lib/route/search-params";
import {
    buildCapturesRouteContract,
    canOpenAssistantFromCapturesContract,
} from "../_page-model/build";
import { enforceCapturesRouteContract } from "../_page-model/validate";
import { CapturesClientView } from "./CapturesClientView";

type SortBy = "createdAt" | "title" | "extractedCount";
type SortDir = "asc" | "desc";

type CapturesPageDataProps = {
    aspect: AspectId;
    search?: string;
    status?: CaptureStatus;
    sortBy: SortBy;
    sortDir: SortDir;
    view: IndexViewMode;
};

export async function CapturesPageData({
    aspect,
    search,
    status,
    sortBy,
    sortDir,
    view,
}: CapturesPageDataProps) {
    const dataSource = getDataSourceAdapters();
    const capturesIndex = await dataSource.captures.getCapturesIndex({
        lens: { scope: aspect },
        search: search || undefined,
        status,
        sortBy,
        sortDir,
    });

    const contract = buildCapturesRouteContract({
        lens: { scope: aspect },
        capturesIndex,
    });
    const { pageModelValidation, payload } =
        enforceCapturesRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/captures",
        ok: pageModelValidation.ok,
    });

    const captureSearchItems = capturesIndex.items
        .slice(0, INDEX_SEARCH_SUGGESTION_LIMIT)
        .map((item) => ({
            id: item.id,
            title: item.title,
            summary: `${item.type} · ${item.status} · ${formatExtractedCountLabel(
                item.extractedCount,
                item.extractedSummary,
            )}`,
            searchTerms: [item.type, item.status],
        }));

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageHeaderContractHydrator
                canOpenAssistant={canOpenAssistantFromCapturesContract(contract)}
                searchItems={captureSearchItems}
            />
            <CapturesClientView
                items={capturesIndex.items}
                aspect={aspect}
                search={search}
                status={status}
                sortBy={sortBy}
                sortDir={sortDir}
                view={view}
            />
        </>
    );
}
