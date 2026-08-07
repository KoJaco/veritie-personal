import { notFound } from "next/navigation";
import { PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { getDataSourceAdapters } from "@/lib/data-source";
import { CaptureDetailView } from "./_components/CaptureDetailView";

interface CaptureDetailPageProps {
    params: Promise<{ captureId: string }>;
    searchParams: Promise<{ anchor?: string }>;
}

export default async function CaptureDetailPage({
    params,
    searchParams,
}: CaptureDetailPageProps) {
    const { captureId } = await params;
    const { anchor } = await searchParams;
    const dataSource = getDataSourceAdapters();
    const detail = await dataSource.captures.getCaptureDetail(captureId);

    if (!detail) {
        notFound();
    }

    const glossaryLabels = await dataSource.pipeline.getExtractionGlossaryLabels();

    return (
        <PageFrame
            header={
                <PageHeader
                    title={detail.capture.type}
                    description={detail.capture.title ?? "Capture"}
                    separator={false}
                />
            }
        >
            <CaptureDetailView
                detail={detail}
                initialExtractedValueId={anchor}
                glossaryLabels={glossaryLabels}
            />
        </PageFrame>
    );
}
