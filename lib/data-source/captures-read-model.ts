import { envServer } from "@/lib/config/env.server";
import type { AspectKey } from "@/lib/domain/aspect";
import type { ReviewState } from "@/lib/domain/extraction";
import type { TimelineEventType } from "@/lib/domain/timeline";
import type { ScopeLens } from "@/lib/lens";
import { aspectIdsMatchLens } from "@/lib/aspect-lens";
import {
    CAPTURE_SEEDS,
    EXTRACTED_VALUE_SEEDS,
    EXTRACTION_RUN_SEEDS,
    SOURCE_ANCHOR_SEEDS,
    TRANSCRIPT_SEGMENT_SEEDS,
    VOICE_LOG_SEEDS,
    type CaptureStub,
    type ExtractedValueStub,
    type TranscriptSegmentStub,
    type VoiceLogStub,
} from "@/lib/stubs/capture-stubs";
import { TIMELINE_EVENT_SEEDS, type TimelineEventStub } from "@/lib/stubs/timeline-stubs";

export type CaptureIndexItem = {
    id: string;
    title: string;
    type: CaptureStub["type"];
    status: CaptureStub["status"];
    aspectIds: AspectKey[];
    createdAt: string;
    extractedCount: number;
};

export type CapturesIndexReadModel = {
    items: CaptureIndexItem[];
    total: number;
};

export type CaptureDetailReadModel = {
    capture: CaptureStub;
    voiceLog?: VoiceLogStub;
    segments: TranscriptSegmentStub[];
    extractionRun?: typeof EXTRACTION_RUN_SEEDS[number];
    extractedValues: ExtractedValueStub[];
    sourceAnchors: typeof SOURCE_ANCHOR_SEEDS;
};

export type CapturesIndexQuery = {
    lens?: ScopeLens;
    search?: string;
    status?: CaptureStub["status"];
    sortBy?: "createdAt" | "title" | "extractedCount";
    sortDir?: "asc" | "desc";
};

export function getCapturesIndex(
    query?: CapturesIndexQuery,
): CapturesIndexReadModel {
    let items = CAPTURE_SEEDS.map((capture) => ({
        id: capture.id,
        title: capture.title ?? "Untitled capture",
        type: capture.type,
        status: capture.status,
        aspectIds: capture.aspectIds,
        createdAt: capture.createdAt,
        extractedCount: EXTRACTED_VALUE_SEEDS.filter(
            (v) => v.captureId === capture.id,
        ).length,
    }));

    if (query?.lens) {
        items = items.filter((item) =>
            aspectIdsMatchLens(item.aspectIds, { aspect: query.lens!.scope }),
        );
    }

    if (query?.search) {
        const q = query.search.toLowerCase();
        items = items.filter((item) => item.title.toLowerCase().includes(q));
    }

    if (query?.status) {
        items = items.filter((item) => item.status === query.status);
    }

    const sortBy = query?.sortBy ?? "createdAt";
    const sortDir = query?.sortDir ?? "desc";
    const direction = sortDir === "asc" ? 1 : -1;

    items.sort((a, b) => {
        if (sortBy === "title") {
            return a.title.localeCompare(b.title) * direction;
        }
        if (sortBy === "extractedCount") {
            return (a.extractedCount - b.extractedCount) * direction;
        }
        return (
            (new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()) *
            direction
        );
    });

    return { items, total: items.length };
}

export function getCaptureDetail(id: string): CaptureDetailReadModel | null {
    const capture = CAPTURE_SEEDS.find((c) => c.id === id);
    if (!capture) return null;

    const voiceLog = VOICE_LOG_SEEDS.find((v) => v.captureId === capture.id);
    const segments = voiceLog
        ? TRANSCRIPT_SEGMENT_SEEDS.filter((s) => s.voiceLogId === voiceLog.id)
        : [];
    const extractionRun = EXTRACTION_RUN_SEEDS.find(
        (r) => r.captureId === capture.id,
    );
    const extractedValues = EXTRACTED_VALUE_SEEDS.filter(
        (v) => v.captureId === capture.id,
    );
    const sourceAnchors = SOURCE_ANCHOR_SEEDS.filter((a) =>
        extractedValues.some((v) => v.id === a.extractedValueId),
    );

    return {
        capture,
        voiceLog,
        segments,
        extractionRun,
        extractedValues,
        sourceAnchors,
    };
}

export function findCaptureByVeritieJobId(
    veritieJobId: string,
): CaptureStub | undefined {
    return CAPTURE_SEEDS.find((c) => c.veritieJobId === veritieJobId);
}

export function appendCaptureFromJob(input: {
    capture: CaptureStub;
    voiceLog: VoiceLogStub;
    segments: TranscriptSegmentStub[];
    extractedValues: ExtractedValueStub[];
}): CaptureStub {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Stub capture mutations are disabled");
    }
    CAPTURE_SEEDS.push(input.capture);
    VOICE_LOG_SEEDS.push(input.voiceLog);
    TRANSCRIPT_SEGMENT_SEEDS.push(...input.segments);
    EXTRACTED_VALUE_SEEDS.push(...input.extractedValues);
    return input.capture;
}

export function mergeCaptureEnrichment(input: {
    captureId: string;
    status?: CaptureStub["status"];
    extractedValues: ExtractedValueStub[];
    timelineEvents: TimelineEventStub[];
    voiceLogArtifacts?: {
        indexArtifact?: Record<string, unknown> | null;
        extractionPayload?: Record<string, unknown> | null;
    };
}): void {
    if (!envServer.allowStubCaptureMutations) {
        throw new Error("Stub capture mutations are disabled");
    }

    const capture = CAPTURE_SEEDS.find((item) => item.id === input.captureId);
    if (!capture) {
        throw new Error("Capture not found for enrichment");
    }

    if (input.status) {
        capture.status = input.status;
        capture.updatedAt = new Date().toISOString();
    }

    const existingValueIds = new Set(EXTRACTED_VALUE_SEEDS.map((value) => value.id));
    for (const value of input.extractedValues) {
        if (!existingValueIds.has(value.id)) {
            EXTRACTED_VALUE_SEEDS.push(value);
            existingValueIds.add(value.id);
        }
    }

    const existingEventIds = new Set(TIMELINE_EVENT_SEEDS.map((event) => event.id));
    for (const event of input.timelineEvents) {
        if (!existingEventIds.has(event.id)) {
            TIMELINE_EVENT_SEEDS.push(event);
            existingEventIds.add(event.id);
        }
    }

    if (input.voiceLogArtifacts) {
        const voiceLog = VOICE_LOG_SEEDS.find(
            (item) => item.captureId === input.captureId,
        );
        if (voiceLog) {
            if (input.voiceLogArtifacts.indexArtifact !== undefined) {
                voiceLog.indexArtifact = input.voiceLogArtifacts.indexArtifact;
            }
            if (input.voiceLogArtifacts.extractionPayload !== undefined) {
                voiceLog.extractionPayload =
                    input.voiceLogArtifacts.extractionPayload;
            }
            voiceLog.updatedAt = new Date().toISOString();
        }
    }
}
