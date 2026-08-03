import type { ScopeCoverageGap } from "@/lib/stubs";

export type TimelineSegment =
    | {
          type: "covered";
          start: string;
          end: string;
          days: number;
      }
    | {
          type: "gap";
          start: string;
          end: string;
          days: number;
          gapKey: string;
          gap: ScopeCoverageGap;
      };

export type CoverageModel = {
    windowStart: string;
    windowEnd: string;
    windowDays: number;
    segments: TimelineSegment[];
    gaps: Array<{ key: string; gap: ScopeCoverageGap }>;
    totals: {
        totalGapDays: number;
        longestGapDays: number;
        checksImpactedCount: number;
    };
};

function toUtcDate(dateISO: string): Date {
    return new Date(`${dateISO}T00:00:00.000Z`);
}

export function daysBetweenInclusive(startISO: string, endISO: string): number {
    const start = toUtcDate(startISO);
    const end = toUtcDate(endISO);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay);
    return Math.max(diff + 1, 1);
}

function addDays(dateISO: string, deltaDays: number): string {
    const base = toUtcDate(dateISO);
    base.setUTCDate(base.getUTCDate() + deltaDays);
    return base.toISOString().slice(0, 10);
}

export function percentIntoWindow(
    dateISO: string,
    windowStartISO: string,
    windowDays: number,
): number {
    const daysFromStart = daysBetweenInclusive(windowStartISO, dateISO) - 1;
    if (windowDays <= 1) return 0;
    const raw = (daysFromStart / (windowDays - 1)) * 100;
    return Math.min(Math.max(raw, 0), 100);
}

function gapKey(gap: ScopeCoverageGap): string {
    return `${gap.start}__${gap.end}`;
}

export function buildCoverageModel(
    windowStart: string,
    windowEnd: string,
    gapsRaw: ScopeCoverageGap[],
): CoverageModel {
    const gaps = [...gapsRaw]
        .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
        .map((gap) => ({ key: gapKey(gap), gap }));

    const totals = gaps.reduce(
        (acc, { gap }) => {
            acc.totalGapDays += gap.days;
            acc.longestGapDays = Math.max(acc.longestGapDays, gap.days);
            for (const id of gap.checkIds) acc.checkIds.add(id);
            return acc;
        },
        {
            totalGapDays: 0,
            longestGapDays: 0,
            checkIds: new Set<string>(),
        },
    );

    const segments: TimelineSegment[] = [];
    let cursor = windowStart;

    for (const { key, gap } of gaps) {
        if (cursor < gap.start) {
            const coveredEnd = addDays(gap.start, -1);
            segments.push({
                type: "covered",
                start: cursor,
                end: coveredEnd,
                days: daysBetweenInclusive(cursor, coveredEnd),
            });
        }

        segments.push({
            type: "gap",
            start: gap.start,
            end: gap.end,
            days: gap.days,
            gapKey: key,
            gap,
        });

        cursor = addDays(gap.end, 1);
    }

    if (cursor <= windowEnd) {
        segments.push({
            type: "covered",
            start: cursor,
            end: windowEnd,
            days: daysBetweenInclusive(cursor, windowEnd),
        });
    }

    return {
        windowStart,
        windowEnd,
        windowDays: daysBetweenInclusive(windowStart, windowEnd),
        segments,
        gaps,
        totals: {
            totalGapDays: totals.totalGapDays,
            longestGapDays: totals.longestGapDays,
            checksImpactedCount: totals.checkIds.size,
        },
    };
}
