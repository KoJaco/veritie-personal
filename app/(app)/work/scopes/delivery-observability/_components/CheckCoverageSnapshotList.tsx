import { Badge } from "@/components/ui/badge";
import { SURFACE_CLASS } from "@/lib/ui/surface";

type CheckCoverageSnapshot = {
    id: string;
    name: string;
    gapDays: number;
    coveredPercent: number;
};

type CheckCoverageSnapshotListProps = {
    checkCoverage: CheckCoverageSnapshot[];
};

export function CheckCoverageSnapshotList({
    checkCoverage,
}: CheckCoverageSnapshotListProps) {
    return (
        <div className="space-y-3">
            {checkCoverage.map((check) => (
                <div
                    key={check.id}
                    className={`${SURFACE_CLASS} flex items-center justify-between p-4 text-sm`}
                >
                    <div className="min-w-0 w-full">
                        <div className="flex justify-between items-center w-full">
                            <p className="font-medium text-foreground">
                                {check.name}
                            </p>
                            <Badge variant="secondary" className="ml-auto">
                                {check.coveredPercent}% covered
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {check.gapDays} gap day
                            {check.gapDays === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
