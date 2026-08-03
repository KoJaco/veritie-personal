import { NextRequest, NextResponse } from "next/server";
import { updateExtractedValueReviewState } from "@/lib/data-source/timeline-read-model";
import type { ReviewState } from "@/lib/domain/extraction";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const id = body.extractedValueId as string | undefined;
        const reviewState = body.reviewState as ReviewState | undefined;

        if (!id || !reviewState) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        updateExtractedValueReviewState(id, reviewState);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[extracted-values] review_failed", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
