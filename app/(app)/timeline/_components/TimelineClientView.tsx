"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTimelineEventDetailAction } from "@/lib/actions/stub-data-mutations";
import type { ReviewState } from "@/lib/domain/extraction";
import type { TimelineIndexItem } from "@/lib/data-source/timeline-read-model";
import type { TimelineEventDetailReadModel } from "@/lib/data-source/timeline-read-model";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { TimelineEventRow } from "./TimelineEventRow";
import { TimelineDetailPanel } from "./TimelineDetailPanel";
import {
    formatLocalDateGroupLabel,
    getLocalDateKey,
} from "@/lib/format/local-calendar-date";
import { compareTimelineIndexItems } from "@/lib/timeline/sort-timeline-index-items";

function groupByLocalDate(items: TimelineIndexItem[]) {
    const sortedItems = [...items].sort(compareTimelineIndexItems);
    const groups = new Map<string, TimelineIndexItem[]>();
    for (const item of sortedItems) {
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
    const [loadedDetail, setLoadedDetail] =
        useState<TimelineEventDetailReadModel | null>(null);
    const [captureDetail, setCaptureDetail] =
        useState<CaptureDetailReadModel | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [reviewStateOverrides, setReviewStateOverrides] = useState<
        Record<string, ReviewState>
    >({});
    const groups = useMemo(() => groupByLocalDate(items), [items]);

    const selectedItem = useMemo(
        () => items.find((item) => item.id === selectedId) ?? null,
        [items, selectedId],
    );

    const panelReviewState = useMemo(() => {
        if (!selectedId) {
            return undefined;
        }
        if (reviewStateOverrides[selectedId]) {
            return reviewStateOverrides[selectedId];
        }
        return (
            loadedDetail?.extractedValue?.reviewState ?? selectedItem?.reviewState
        );
    }, [
        loadedDetail?.extractedValue?.reviewState,
        reviewStateOverrides,
        selectedId,
        selectedItem?.reviewState,
    ]);

    const loadDetail = useCallback(
        async (
            eventId: string,
            options?: { signal?: AbortSignal; background?: boolean },
        ) => {
            if (!options?.background) {
                setDetailLoading(true);
            }
            setDetailError(null);

            try {
                const body = await getTimelineEventDetailAction(eventId);
                if (options?.signal?.aborted) return;
                if (!body) {
                    throw new Error("Could not load event detail");
                }
                setLoadedDetail(body.detail);
                setCaptureDetail(body.captureDetail);
            } catch (error) {
                if (options?.signal?.aborted) return;
                if (!options?.background) {
                    setLoadedDetail(null);
                    setCaptureDetail(null);
                }
                setDetailError(
                    error instanceof Error
                        ? error.message
                        : "Could not load event detail",
                );
            } finally {
                if (!options?.signal?.aborted && !options?.background) {
                    setDetailLoading(false);
                }
            }
        },
        [],
    );

    const refreshDetailInBackground = useCallback(() => {
        if (!selectedId) {
            return;
        }
        void loadDetail(selectedId, { background: true }).then(() => {
            router.refresh();
        });
    }, [loadDetail, router, selectedId]);

    const handleReviewUpdated = useCallback(
        (eventId: string, nextState: ReviewState) => {
            setReviewStateOverrides((current) => ({
                ...current,
                [eventId]: nextState,
            }));

            if (selectedId === eventId) {
                setLoadedDetail((current) => {
                    if (!current?.extractedValue) {
                        return current;
                    }
                    return {
                        ...current,
                        extractedValue: {
                            ...current.extractedValue,
                            reviewState: nextState,
                        },
                    };
                });
            }
        },
        [selectedId],
    );

    const handleClose = useCallback(() => {
        setSelectedId(null);
    }, []);

    useEffect(() => {
        if (!selectedId) {
            setLoadedDetail(null);
            setCaptureDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }

        const controller = new AbortController();
        void loadDetail(selectedId, { signal: controller.signal });
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
                                    reviewState={
                                        reviewStateOverrides[item.id] ??
                                        item.reviewState
                                    }
                                    glossaryLabels={glossaryLabels}
                                    onSelect={setSelectedId}
                                    onReviewUpdated={(nextState) =>
                                        handleReviewUpdated(item.id, nextState)
                                    }
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
                selectedItem={selectedItem}
                loadedDetail={loadedDetail}
                captureDetail={captureDetail}
                glossaryLabels={glossaryLabels}
                isLoading={detailLoading}
                error={detailError}
                reviewState={panelReviewState}
                onReviewUpdated={(nextState) => {
                    if (selectedId) {
                        handleReviewUpdated(selectedId, nextState);
                    }
                }}
                onDetailRefresh={refreshDetailInBackground}
                onClose={handleClose}
            />
        </div>
    );
}
