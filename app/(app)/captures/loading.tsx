import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeaderContractReset } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { CapturesListSkeleton } from "./_components/CapturesListSkeleton";
import { CapturesPageHeader } from "./_components/CapturesPageHeader";

export default function CapturesLoading() {
    return (
        <>
            <ContextPayloadSlot payload={null} />
            <PageHeaderContractReset resetKey="loading" />
            <PageFrame
                header={
                    <CapturesPageHeader
                        aspect="all"
                        sortBy="createdAt"
                        sortDir="desc"
                        view="cards"
                    />
                }
            >
                <CapturesListSkeleton view="cards" />
            </PageFrame>
        </>
    );
}
