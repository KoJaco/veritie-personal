import { PageHeaderContractReset } from "@/components/route";
import { IndexedResultSurfaceSkeleton } from "@/components/capture/indexed-result";
import { PageFrame } from "@/components/static/PageFrame";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import { CaptureDetailPageHeader } from "./_components/CaptureDetailPageHeader";

export default function CaptureDetailLoading() {
    return (
        <>
            <PageHeaderContractReset resetKey="loading" />
            <PageFrame header={<CaptureDetailPageHeader />}>
                <div className={cn(SURFACE_CLASS, "p-3")}>
                    <IndexedResultSurfaceSkeleton expectAudio />
                </div>
            </PageFrame>
        </>
    );
}
