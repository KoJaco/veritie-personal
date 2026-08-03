import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { IndexSearchCommand, IndexViewToggle, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import { getDataSourceAdapters } from "@/lib/data-source";
import { logger } from "@/lib/logging/server-logger";
import {
    getAspectLensFromSearchParams,
    type SearchParamRecord,
} from "@/lib/aspect-lens";
import {
    getStringParam,
    INDEX_SEARCH_SUGGESTION_LIMIT,
    parseCaptureStatus,
    parseCapturesSortBy,
    parseCapturesView,
    parseSortDir,
} from "@/lib/route/search-params";
import {
    buildCapturesRouteContract,
    canOpenAssistantFromCapturesContract,
} from "./_page-model/build";
import { enforceCapturesRouteContract } from "./_page-model/validate";
import { CapturesClientView } from "./_components/CapturesClientView";
import { CapturesFilterSheet } from "./_components/CapturesFilterSheet";

interface CapturesPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function CapturesPage({ searchParams }: CapturesPageProps) {
    const resolved = await searchParams;
    const lens = getAspectLensFromSearchParams(resolved);
    const search = getStringParam(resolved.q);
    const status = parseCaptureStatus(getStringParam(resolved.status));
    const sortBy = parseCapturesSortBy(getStringParam(resolved.sortBy));
    const sortDir = parseSortDir(getStringParam(resolved.sortDir));
    const view = parseCapturesView(getStringParam(resolved.view));

    const dataSource = getDataSourceAdapters();
    const capturesIndex = dataSource.captures.getCapturesIndex({
        lens: { scope: lens.aspect },
        search: search || undefined,
        status,
        sortBy,
        sortDir,
    });

    const contract = buildCapturesRouteContract({
        lens: { scope: lens.aspect },
        capturesIndex,
    });
    const { pageModelValidation, payload } = enforceCapturesRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/captures",
        ok: pageModelValidation.ok,
    });

    const captureSearchItems = capturesIndex.items
        .slice(0, INDEX_SEARCH_SUGGESTION_LIMIT)
        .map((item) => ({
            id: item.id,
            title: item.title,
            summary: `${item.type} · ${item.status} · ${item.extractedCount} extracted`,
            searchTerms: [item.type, item.status],
        }));

    const headerBaseParams = {
        aspect: lens.aspect,
        q: search,
        status,
        sortBy,
        sortDir,
        view,
    };

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
            header={
                <PageHeader
                    title="Captures"
                    description="Voice logs and uploaded sources."
                    separator={false}
                    actions={
                        <>
                            <IndexSearchCommand
                                route="/captures"
                                search={search}
                                baseParams={headerBaseParams}
                                items={captureSearchItems}
                                dialogTitle="Search captures"
                                dialogDescription="Search captures by title, type, or status."
                                placeholder="Search captures…"
                                recentHeading="Recent captures"
                                matchingHeading="Matching captures"
                            />
                            <CapturesFilterSheet
                                aspect={lens.aspect}
                                search={search}
                                status={status}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                view={view}
                            />
                            <IndexViewToggle
                                route="/captures"
                                baseParams={headerBaseParams}
                                view={view}
                            />
                            <PageAssistantAction
                                canOpenAssistant={canOpenAssistantFromCapturesContract(
                                    contract,
                                )}
                            />
                        </>
                    }
                />
            }
        >
            <CapturesClientView
                items={capturesIndex.items}
                aspect={lens.aspect}
                search={search}
                status={status}
                sortBy={sortBy}
                sortDir={sortDir}
                view={view}
            />
        </PageFrame>
        </>
    );
}
