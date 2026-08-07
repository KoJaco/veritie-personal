"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTimelineEventDetailAction } from "@/lib/actions/stub-data-mutations";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import type { TimelineEventDetailReadModel } from "@/lib/data-source/timeline-read-model";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { TimelineEventRow } from "./TimelineEventRow";
import { TimelineDetailPanel } from "./TimelineDetailPanel";
import {
    formatLocalDateGroupLabel,
    getLocalDateKey,
} from "@/lib/format/local-calendar-date";

function groupByLocalDate(items: TimelineIndexItem[]) {
    const groups = new Map<string, TimelineIndexItem[]>();
    for (const item of items) {
        const key = getLocalDateKey(item.occurredAt);
        const list = groups.get(key) ?? [];
        list.push(item);
        groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function TimelineClientView({
    items,
    glossaryLabels,
}: {
    items: TimelineIndexItem[];
    glossaryLabels?: Record<string, string>;
}) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] =
        useState<TimelineEventDetailReadModel | null>(null);
    const [selectedCapture, setSelectedCapture] =
        useState<CaptureDetailReadModel | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const groups = useMemo(() => groupByLocalDate(items), [items]);

    const loadDetail = useCallback(
        async (eventId: string, signal?: AbortSignal) => {
            setDetailLoading(true);
            setDetailError(null);

            try {
                const body = await getTimelineEventDetailAction(eventId);
                if (signal?.aborted) return;
                if (!body) {
                    throw new Error("Could not load event detail");
                }
                setSelectedDetail(body.detail);
                setSelectedCapture(body.captureDetail);
            } catch (error) {
                if (signal?.aborted) return;
                setSelectedDetail(null);
                setSelectedCapture(null);
                setDetailError(
                    error instanceof Error ? error.message : "Could not load event detail",
                );
            } finally {
                if (!signal?.aborted) {
                    setDetailLoading(false);
                }
            }
        },
        [],
    );

    const refreshDetail = useCallback(() => {
        if (!selectedId) {
            return;
        }
        void loadDetail(selectedId).then(() => {
            router.refresh();
        });
    }, [loadDetail, router, selectedId]);

    useEffect(() => {
        if (!selectedId) {
            setSelectedDetail(null);
            setSelectedCapture(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }

        const controller = new AbortController();
        void loadDetail(selectedId, controller.signal);
        return () => controller.abort();
    }, [loadDetail, selectedId]);

    return (
        <div className="relative">
            <div className="space-y-8">
                {groups.map(([dateKey, groupItems]) => (
                    <section key={dateKey} className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            {formatLocalDateGroupLabel(groupItems[0].occurredAt)}
                        </h2>
                        <div className="space-y-1.5">
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

            {detailError && selectedId && (
                <p className="mt-4 text-sm text-destructive">{detailError}</p>
            )}

            {detailLoading && selectedId && (
                <p className="mt-4 text-sm text-muted-foreground">Loading detail…</p>
            )}

            <TimelineDetailPanel
                detail={detailLoading ? null : selectedDetail}
                captureDetail={selectedCapture}
                glossaryLabels={glossaryLabels}
                onDetailUpdated={refreshDetail}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
}
