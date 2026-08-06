"use client";

import type { CaptureDetailReadModel } from "@/lib/data-source/captures-read-model";
import { CaptureDetailIndexedView } from "./CaptureDetailIndexedView";

export function CaptureDetailView({
    detail,
    initialExtractedValueId: _initialExtractedValueId,
}: {
    detail: CaptureDetailReadModel;
    initialExtractedValueId?: string | null;
}) {
    return <CaptureDetailIndexedView detail={detail} />;
}
