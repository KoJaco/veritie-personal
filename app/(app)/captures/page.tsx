import { IndexSearchCommand, IndexViewToggle, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import { getDataSourceAdapters } from "@/lib/data-source";
import {
    getAspectLensFromSearchParams,
    type SearchParamRecord,
} from "@/lib/aspect-lens";
import { CapturesClientView } from "./_components/CapturesClientView";
import { CapturesFilterSheet } from "./_components/CapturesFilterSheet";

interface CapturesPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function CapturesPage({ searchParams }: CapturesPageProps) {
    const resolved = await searchParams;
    const lens = getAspectLensFromSearchParams(resolved);
    const search = getString(resolved.q);
    const status = parseStatus(getString(resolved.status));
    const sortBy = parseSortBy(getString(resolved.sortBy));
    const sortDir = parseSortDir(getString(resolved.sortDir));
    const view = parseView(getString(resolved.view));

    const dataSource = getDataSourceAdapters();
    const capturesIndex = dataSource.captures.getCapturesIndex({
        lens: { scope: lens.aspect },
        search: search || undefined,
        status,
        sortBy,
        sortDir,
    });

    const captureSearchItems = capturesIndex.items.map((item) => ({
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
                            <PageAssistantAction canOpenAssistant={true} />
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
    );
}

function getString(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

function parseStatus(
    value: string | undefined,
): "completed" | "processing" | "failed" | undefined {
    if (value === "completed" || value === "processing" || value === "failed") {
        return value;
    }
    return undefined;
}

function parseSortBy(
    value: string | undefined,
): "createdAt" | "title" | "extractedCount" {
    if (value === "title" || value === "extractedCount") return value;
    return "createdAt";
}

function parseSortDir(value: string | undefined): "asc" | "desc" {
    return value === "asc" ? "asc" : "desc";
}

function parseView(value: string | undefined): "cards" | "table" {
    return value === "table" ? "table" : "cards";
}
