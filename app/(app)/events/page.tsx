import { EmptyState, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Calendar } from "lucide-react";

export default function EventsPage() {
    return (
        <PageFrame header={<PageHeader title="Events" separator={false} />}>
            <EmptyState
                title="Events coming soon"
                description="Review calendar events and detected schedules extracted from your captures."
                icon={<Calendar className="h-10 w-10" />}
            />
        </PageFrame>
    );
}
