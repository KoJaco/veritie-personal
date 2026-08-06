"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IndexedResultSurface } from "@/components/capture/indexed-result";
import {
    fetchCaptureAudioPlaybackUrl,
} from "@/lib/capture/capture-audio-client";
import { mapCaptureDetailToIndexedProps } from "@/lib/capture/map-capture-detail-to-indexed-props";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";

export function CaptureDetailIndexedView({
    detail,
    glossaryLabels,
}: {
    detail: CaptureDetailReadModel;
    glossaryLabels?: Record<string, string>;
}) {
    const router = useRouter();
    const hasAudioUri = Boolean(detail.voiceLog?.audioUri);
    const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(null);
    const audioUrl = hasAudioUri ? fetchedAudioUrl : null;

    useEffect(() => {
        if (!hasAudioUri) {
            return;
        }

        let cancelled = false;
        void fetchCaptureAudioPlaybackUrl(detail.capture.id).then((url) => {
            if (!cancelled) {
                setFetchedAudioUrl(url);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [detail.capture.id, hasAudioUri]);

    const indexedProps = mapCaptureDetailToIndexedProps(detail, audioUrl);

    return (
        <IndexedResultSurface
            {...indexedProps}
            layout="default"
            expectAudio={hasAudioUri}
            showIndexingBanner={false}
            glossaryLabels={glossaryLabels}
            captureId={detail.capture.id}
            extractedValues={detail.extractedValues}
            onExtractedValueSaved={() => router.refresh()}
        />
    );
}
