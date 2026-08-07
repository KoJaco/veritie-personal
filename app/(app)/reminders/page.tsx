import { EmptyState, PageHeader } from "@/components/route";
import { PageFrame } from "@/components/static/PageFrame";
import { Bell } from "lucide-react";

export default function RemindersPage() {
    return (
        <PageFrame header={<PageHeader title="Reminders" separator={false} />}>
            <EmptyState
                title="Reminders coming soon"
                description="Track follow-ups and reminders extracted from voice captures in one place."
                icon={<Bell className="h-10 w-10" />}
            />
        </PageFrame>
    );
}
