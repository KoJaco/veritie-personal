"use client";

import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { CaptureIndexedSurface } from "@/components/indexed-result";

export function CaptureDetailView({
    detail,
    initialExtractedValueId,
}: {
    detail: CaptureDetailReadModel;
    initialExtractedValueId?: string | null;
}) {
    return (
        <CaptureIndexedSurface
            detail={detail}
            initialExtractedValueId={initialExtractedValueId}
        />
    );
}
