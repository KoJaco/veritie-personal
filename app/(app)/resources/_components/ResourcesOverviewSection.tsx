import { SURFACE_CLASS } from "@/lib/ui/surface";

type ResourcesOverviewSectionProps = {
    summary: {
        totalResources: number;
        servicesCount: number;
        monitoredResources: number;
        resourcesWithEvidenceGaps: number;
    };
};

export function ResourcesOverviewSection({ summary }: ResourcesOverviewSectionProps) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-base font-semibold">Overview</h2>
                <p className="text-sm text-muted-foreground">
                    Tenant-level posture entities grouped for operational
                    review.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Tracked resources"
                    value={String(summary.totalResources)}
                    detail="Tenant-level posture entities tracked across the business."
                />
                <SummaryCard
                    label="Services"
                    value={String(summary.servicesCount)}
                    detail="Operational services kept distinct from external connections."
                />
                <SummaryCard
                    label="Monitored"
                    value={String(summary.monitoredResources)}
                    detail="Resources with active monitoring coverage flags."
                />
                <SummaryCard
                    label="Attachment gaps"
                    value={String(summary.resourcesWithEvidenceGaps)}
                    detail="Resources still missing supporting attachments coverage."
                />
            </div>
        </section>
    );
}

function SummaryCard({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className={`${SURFACE_CLASS} space-y-2 p-4`}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
    );
}
