"use client";

import { useEffect, useState } from "react";

import { IndexedResultSurface } from "@/components/capture/indexed-result";
import {
    fetchCaptureAudioPlaybackUrl,
} from "@/lib/capture/capture-audio-client";
import { mapCaptureDetailToIndexedProps } from "@/lib/capture/map-capture-detail-to-indexed-props";
import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";

export function CaptureDetailIndexedView({
    detail,
}: {
    detail: CaptureDetailReadModel;
}) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const hasAudioUri = Boolean(detail.voiceLog?.audioUri);

    useEffect(() => {
        if (!hasAudioUri) {
            setAudioUrl(null);
            return;
        }

        let cancelled = false;
        void fetchCaptureAudioPlaybackUrl(detail.capture.id).then((url) => {
            if (!cancelled) {
                setAudioUrl(url);
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
        />
    );
}
