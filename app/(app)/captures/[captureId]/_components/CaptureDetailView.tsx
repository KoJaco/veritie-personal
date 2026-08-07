"use client";

import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { CaptureDetailIndexedView } from "./CaptureDetailIndexedView";

export function CaptureDetailView({
    detail,
    glossaryLabels,
    initialExtractedValueId: _initialExtractedValueId,
}: {
    detail: CaptureDetailReadModel;
    glossaryLabels?: Record<string, string>;
    initialExtractedValueId?: string | null;
}) {
    return (
        <CaptureDetailIndexedView
            detail={detail}
            glossaryLabels={glossaryLabels}
        />
    );
}
