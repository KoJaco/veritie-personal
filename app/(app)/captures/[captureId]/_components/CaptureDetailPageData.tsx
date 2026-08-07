import { notFound } from "next/navigation";

import { PageHeaderContractHydrator } from "@/components/route";
import { getDataSourceAdapters } from "@/lib/data-source";
import { CaptureDetailView } from "./CaptureDetailView";

export async function CaptureDetailPageData({
    captureId,
    anchor,
}: {
    captureId: string;
    anchor?: string;
}) {
    const dataSource = getDataSourceAdapters();
    const detail = await dataSource.captures.getCaptureDetail(captureId);

    if (!detail) {
        notFound();
    }

    const glossaryLabels =
        await dataSource.pipeline.getExtractionGlossaryLabels();

    return (
        <>
            <PageHeaderContractHydrator
                canOpenAssistant={false}
                searchItems={[]}
                suggestionsReady={false}
                headerTitle={detail.capture.type}
                headerDescription={detail.capture.title ?? "Capture"}
            />
            <CaptureDetailView
                detail={detail}
                initialExtractedValueId={anchor}
                glossaryLabels={glossaryLabels}
            />
        </>
    );
}
