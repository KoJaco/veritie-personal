"use client";

import { useMemo, useState } from "react";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import type { TimelineEventDetailReadModel } from "@/lib/data-source/timeline-read-model";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { TimelineEventRow } from "./TimelineEventRow";
import { TimelineDetailPanel } from "./TimelineDetailPanel";

function groupByDate(items: TimelineIndexItem[]) {
    const groups = new Map<string, TimelineIndexItem[]>();
    for (const item of items) {
        const key = item.occurredAt.slice(0, 10);
        const list = groups.get(key) ?? [];
        list.push(item);
        groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function TimelineClientView({
    items,
    detailsById,
    capturesById,
}: {
    items: TimelineIndexItem[];
    detailsById: Record<string, TimelineEventDetailReadModel>;
    capturesById: Record<string, CaptureDetailReadModel>;
}) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const groups = useMemo(() => groupByDate(items), [items]);
    const selectedDetail = selectedId ? detailsById[selectedId] : null;
    const selectedCaptureId = selectedDetail?.event.captureId;
    const selectedCapture = selectedCaptureId
        ? capturesById[selectedCaptureId]
        : null;

    return (
        <div className="relative">
            <div className="space-y-8">
                {groups.map(([date, groupItems]) => (
                    <section key={date} className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            {new Date(date).toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                        </h2>
                        <div className="space-y-2">
                            {groupItems.map((item) => (
                                <TimelineEventRow
                                    key={item.id}
                                    item={item}
                                    selected={selectedId === item.id}
                                    onSelect={setSelectedId}
                                />
                            ))}
                        </div>
                    </section>
                ))}
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No timeline events match your filters.
                    </p>
                )}
            </div>
            <TimelineDetailPanel
                detail={selectedDetail}
                captureDetail={selectedCapture}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
}
