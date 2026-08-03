import { SURFACE_CLASS_NESTED } from "@/lib/ui/surface";

type SnapshotStatsProps = {
    totalGapDays: number;
    checksImpactedCount: number;
    longestGapDays: number;
};

export function SnapshotStats({
    totalGapDays,
    checksImpactedCount,
    longestGapDays,
}: SnapshotStatsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${SURFACE_CLASS_NESTED} p-4`}>
                <p className="text-xs text-muted-foreground">Gap days</p>
                <p className="text-lg font-semibold">{totalGapDays}</p>
            </div>
            <div className={`${SURFACE_CLASS_NESTED} p-4`}>
                <p className="text-xs text-muted-foreground">Checks impacted</p>
                <p className="text-lg font-semibold">{checksImpactedCount}</p>
            </div>
            <div className={`${SURFACE_CLASS_NESTED} p-4`}>
                <p className="text-xs text-muted-foreground">Longest gap</p>
                <p className="text-lg font-semibold">{longestGapDays} days</p>
            </div>
        </div>
    );
}
