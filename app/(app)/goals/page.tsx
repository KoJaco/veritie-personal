import { EmptyState, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Target } from "lucide-react";

export default function GoalsPage() {
    return (
        <PageFrame header={<PageHeader title="Goals" separator={false} />}>
            <EmptyState
                title="Goals coming soon"
                description="Track personal and work goals in one place. This area is planned for a post-MVP release."
                icon={<Target className="h-10 w-10" />}
            />
        </PageFrame>
    );
}
