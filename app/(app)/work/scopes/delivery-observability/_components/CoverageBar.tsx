import { formatShortDate } from "@/lib/format/date";
import { formatScopeCheckLabels } from "@/lib/stubs";
import { type CoverageModel } from "../_lib/model";
import { SURFACE_CLASS_NESTED } from "@/lib/ui/surface";

type CoverageBarProps = {
    model: CoverageModel;
};

export function CoverageBar({ model }: CoverageBarProps) {
    const { windowStart, windowEnd, gaps, segments } = model;

    return (
        <div className="space-y-3">
            {gaps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-sm text-muted-foreground">
                    No coverage gaps in this window.
                </div>
            ) : null}

            <div className="relative h-115 max-h-130 overflow-y-auto pr-1">
                <span
                    className="pointer-events-none absolute left-1.25 top-8 bottom-8 w-0.5 bg-muted-foreground/25 rounded-lg"
                    aria-hidden
                />

                <ol className="relative flex min-h-full flex-col">
                    <li className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>{formatShortDate(windowStart)}</span>
                    </li>
                    {segments.map((segment) => {
                        const grow = Math.max(segment.days, 1);

                        if (segment.type === "covered") {
                            return (
                                <li
                                    key={`join-${segment.start}-${segment.end}`}
                                    className="grid grid-cols-[28px_1fr] gap-3"
                                    style={{ flexGrow: grow, minHeight: 16 }}
                                />
                            );
                        }

                        return (
                            <li
                                key={segment.gapKey}
                                className="grid grid-cols-[28px_1fr] gap-3"
                                style={{ flexGrow: grow, minHeight: 88 }}
                            >
                                <span className="relative z-10 block size-2 rounded-full border border-background bg-destructive ring-2 ring-muted/40 mt-10 ml-0.5" />

                                <div
                                    className={`${SURFACE_CLASS_NESTED} p-3 text-sm h-20`}
                                >
                                    <p className="font-medium">
                                        Gap detail:{" "}
                                        {formatShortDate(segment.start)} -{" "}
                                        {formatShortDate(segment.end)} (
                                        {segment.days} days)
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        Checks impacted:{" "}
                                        {formatScopeCheckLabels(segment.gap.checkIds)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}

                    <li className="flex items-center justify-between text-xs font-medium text-muted-foreground mt-3">
                        <span>{formatShortDate(windowEnd)}</span>
                    </li>
                </ol>
            </div>
        </div>
    );
}
