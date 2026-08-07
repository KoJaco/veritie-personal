import { Suspense } from "react";

import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeaderContractReset } from "@/components/route";
import { IndexedResultSurfaceSkeleton } from "@/components/capture/indexed-result";
import { PageFrame } from "@/components/static/PageFrame";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { CaptureDetailPageData } from "./_components/CaptureDetailPageData";
import { CaptureDetailPageHeader } from "./_components/CaptureDetailPageHeader";

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

    return (
        <>
            <ContextPayloadSlot payload={null} />
            <PageHeaderContractReset resetKey={captureId} />
            <PageFrame header={<CaptureDetailPageHeader />}>
                <Suspense
                    fallback={
                        <div className={cn(SURFACE_CLASS, "p-3")}>
                            <IndexedResultSurfaceSkeleton expectAudio />
                        </div>
                    }
                >
                    <CaptureDetailPageData
                        captureId={captureId}
                        anchor={anchor}
                    />
                </Suspense>
            </PageFrame>
        </>
    );
}
