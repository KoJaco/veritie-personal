import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeaderContractReset } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { TimelineListSkeleton } from "./_components/TimelineListSkeleton";
import { TimelinePageHeader } from "./_components/TimelinePageHeader";

export default function TimelineLoading() {
    return (
        <>
            <ContextPayloadSlot payload={null} />
            <PageHeaderContractReset resetKey="loading" />
            <PageFrame header={<TimelinePageHeader aspect="all" />}>
                <TimelineListSkeleton />
            </PageFrame>
        </>
    );
}
