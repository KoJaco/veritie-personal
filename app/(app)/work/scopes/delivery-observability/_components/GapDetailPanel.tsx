import { formatShortDate } from "@/lib/format/date";
import { formatScopeCheckLabels, type ScopeCoverageGap } from "@/lib/stubs";
import { SURFACE_CLASS_NESTED } from "@/lib/ui/surface";

type GapDetailPanelProps = {
    gap: ScopeCoverageGap | null;
};

export function GapDetailPanel({ gap }: GapDetailPanelProps) {
    if (!gap) return null;

    return (
        <div className={`${SURFACE_CLASS_NESTED} p-4 text-sm`}>
            <p className="font-medium">
                Gap detail: {formatShortDate(gap.start)} -{" "}
                {formatShortDate(gap.end)} ({gap.days} days)
            </p>
            <p className="mt-1 text-muted-foreground">
                Checks impacted: {formatScopeCheckLabels(gap.checkIds)}
            </p>
        </div>
    );
}
