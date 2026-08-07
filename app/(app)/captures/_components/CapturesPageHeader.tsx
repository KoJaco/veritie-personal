"use client";

import {
    IndexSearchCommand,
    IndexViewToggle,
    PageHeader,
    usePageHeaderContract,
} from "@/components/route";
import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import type { AspectId } from "@/lib/domain/aspect";
import type { IndexViewMode } from "@/components/route/IndexViewToggle";
import { CapturesFilterSheet } from "./CapturesFilterSheet";

type SortBy = "createdAt" | "title" | "extractedCount";
type SortDir = "asc" | "desc";

type CapturesPageHeaderProps = {
    aspect: AspectId;
    search?: string;
    status?: string;
    sortBy: SortBy;
    sortDir: SortDir;
    view: IndexViewMode;
};

export function CapturesPageHeader({
    aspect,
    search,
    status,
    sortBy,
    sortDir,
    view,
}: CapturesPageHeaderProps) {
    const { canOpenAssistant, searchItems, suggestionsReady } =
        usePageHeaderContract();

    const headerBaseParams = {
        aspect,
        q: search,
        status,
        sortBy,
        sortDir,
        view,
    };

    return (
        <PageHeader
            title="Captures"
            description="Voice logs and uploaded sources."
            separator={false}
            actions={
                <>
                    <IndexViewToggle
                        route="/captures"
                        baseParams={headerBaseParams}
                        view={view}
                    />
                    <IndexSearchCommand
                        route="/captures"
                        search={search}
                        baseParams={headerBaseParams}
                        items={searchItems}
                        suggestionsReady={suggestionsReady}
                        dialogTitle="Search captures"
                        dialogDescription="Search captures by title, type, or status."
                        placeholder="Search captures…"
                        recentHeading="Recent captures"
                        matchingHeading="Matching captures"
                    />
                    <CapturesFilterSheet
                        aspect={aspect}
                        search={search}
                        status={status}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        view={view}
                    />
                    <PageAssistantAction canOpenAssistant={canOpenAssistant} />
                </>
            }
        />
    );
}
