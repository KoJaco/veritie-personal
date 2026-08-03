import { EmptyState, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Wallet } from "lucide-react";

export default function MoneyPage() {
    return (
        <PageFrame header={<PageHeader title="Money" separator={false} />}>
            <EmptyState
                title="Money coming soon"
                description="Finance tracking and insights will live here. This area is planned for a post-MVP release."
                icon={<Wallet className="h-10 w-10" />}
            />
        </PageFrame>
    );
}
