import type {
    Capture,
    CaptureSource,
    VoiceLog,
    TranscriptSegment,
} from "@/lib/domain/capture";
import type {
    ExtractedValue,
    ExtractionRun,
    SourceAnchor,
} from "@/lib/domain/extraction";
import type { AspectKey } from "@/lib/domain/aspect";

export type CaptureStub = Capture;
export type CaptureSourceStub = CaptureSource;
export type VoiceLogStub = VoiceLog;
export type TranscriptSegmentStub = TranscriptSegment;
export type ExtractionRunStub = ExtractionRun;
export type ExtractedValueStub = ExtractedValue;
export type SourceAnchorStub = SourceAnchor;

export const CAPTURE_SEEDS: CaptureStub[] = [
    {
        id: "capture_seed_morning_log",
        type: "voice",
        status: "completed",
        title: "Morning voice log",
        aspectIds: ["personal", "finance"],
        createdAt: "2026-08-01T08:15:00.000Z",
        updatedAt: "2026-08-01T08:22:00.000Z",
        veritieJobId: "job_seed_morning",
    },
    {
        id: "capture_seed_fitness_log",
        type: "voice",
        status: "completed",
        title: "Run progress log",
        aspectIds: ["fitness"],
        createdAt: "2026-08-02T07:30:00.000Z",
        updatedAt: "2026-08-02T07:38:00.000Z",
        veritieJobId: "job_seed_fitness",
    },
];

export const VOICE_LOG_SEEDS: VoiceLogStub[] = [
    {
        id: "voice_log_seed_morning",
        captureId: "capture_seed_morning_log",
        transcriptText:
            "I need to call Medibank tomorrow about the claim. Spent forty two dollars at Chemist Warehouse for vitamins. Remind me next Friday to renew the car rego.",
        language: "en",
        durationMs: 42000,
        audioUri: "https://example.local/audio/morning.mp3",
        createdAt: "2026-08-01T08:15:00.000Z",
        updatedAt: "2026-08-01T08:22:00.000Z",
    },
    {
        id: "voice_log_seed_fitness",
        captureId: "capture_seed_fitness_log",
        transcriptText: "I ran 5k today, trying to hit 40k this month.",
        language: "en",
        durationMs: 18000,
        audioUri: "https://example.local/audio/run.mp3",
        createdAt: "2026-08-02T07:30:00.000Z",
        updatedAt: "2026-08-02T07:38:00.000Z",
    },
];

export const TRANSCRIPT_SEGMENT_SEEDS: TranscriptSegmentStub[] = [
    {
        id: "segment_morning_1",
        voiceLogId: "voice_log_seed_morning",
        index: 0,
        startMs: 0,
        endMs: 14000,
        text: "I need to call Medibank tomorrow about the claim.",
        confidence: 0.92,
    },
    {
        id: "segment_morning_2",
        voiceLogId: "voice_log_seed_morning",
        index: 1,
        startMs: 14000,
        endMs: 28000,
        text: "Spent forty two dollars at Chemist Warehouse for vitamins.",
        confidence: 0.88,
    },
    {
        id: "segment_morning_3",
        voiceLogId: "voice_log_seed_morning",
        index: 2,
        startMs: 28000,
        endMs: 42000,
        text: "Remind me next Friday to renew the car rego.",
        confidence: 0.9,
    },
    {
        id: "segment_fitness_1",
        voiceLogId: "voice_log_seed_fitness",
        index: 0,
        startMs: 0,
        endMs: 18000,
        text: "I ran 5k today, trying to hit 40k this month.",
        confidence: 0.94,
    },
];

export const EXTRACTION_RUN_SEEDS: ExtractionRunStub[] = [
    {
        id: "extraction_run_morning",
        captureId: "capture_seed_morning_log",
        status: "completed",
        schemaVersion: "v1",
        startedAt: "2026-08-01T08:22:00.000Z",
        completedAt: "2026-08-01T08:22:30.000Z",
        createdAt: "2026-08-01T08:22:00.000Z",
    },
    {
        id: "extraction_run_fitness",
        captureId: "capture_seed_fitness_log",
        status: "completed",
        schemaVersion: "v1",
        startedAt: "2026-08-02T07:38:00.000Z",
        completedAt: "2026-08-02T07:38:20.000Z",
        createdAt: "2026-08-02T07:38:00.000Z",
    },
];

export const EXTRACTED_VALUE_SEEDS: ExtractedValueStub[] = [
    {
        id: "extracted_task_medibank",
        extractionRunId: "extraction_run_morning",
        captureId: "capture_seed_morning_log",
        objectType: "task",
        aspect: "admin",
        title: "Call Medibank about the claim",
        fields: { dueAt: "2026-08-02T00:00:00.000Z" },
        confidence: 0.86,
        reviewState: "pending",
        createdAt: "2026-08-01T08:22:30.000Z",
        updatedAt: "2026-08-01T08:22:30.000Z",
    },
    {
        id: "extracted_expense_chemist",
        extractionRunId: "extraction_run_morning",
        captureId: "capture_seed_morning_log",
        objectType: "money_entry",
        aspect: "finance",
        title: "Chemist Warehouse vitamins",
        fields: {
            amount: 42,
            currency: "AUD",
            merchantOrPayee: "Chemist Warehouse",
            type: "expense",
        },
        confidence: 0.91,
        reviewState: "pending",
        createdAt: "2026-08-01T08:22:30.000Z",
        updatedAt: "2026-08-01T08:22:30.000Z",
    },
    {
        id: "extracted_reminder_rego",
        extractionRunId: "extraction_run_morning",
        captureId: "capture_seed_morning_log",
        objectType: "reminder",
        aspect: "admin",
        title: "Renew car registration",
        fields: { remindAt: "2026-08-08T09:00:00.000Z" },
        confidence: 0.84,
        reviewState: "pending",
        createdAt: "2026-08-01T08:22:30.000Z",
        updatedAt: "2026-08-01T08:22:30.000Z",
    },
    {
        id: "extracted_goal_progress_run",
        extractionRunId: "extraction_run_fitness",
        captureId: "capture_seed_fitness_log",
        objectType: "goal_progress",
        aspect: "fitness",
        title: "Run 5km",
        fields: { valueDelta: 5, unit: "km" },
        confidence: 0.93,
        reviewState: "pending",
        createdAt: "2026-08-02T07:38:20.000Z",
        updatedAt: "2026-08-02T07:38:20.000Z",
    },
];

export const SOURCE_ANCHOR_SEEDS: SourceAnchorStub[] = [
    {
        id: "anchor_task_medibank",
        extractedValueId: "extracted_task_medibank",
        startMs: 0,
        endMs: 14000,
        textStart: 0,
        textEnd: 48,
        quote: "I need to call Medibank tomorrow about the claim.",
        segmentIds: ["segment_morning_1"],
        confidence: 0.86,
    },
    {
        id: "anchor_expense_chemist",
        extractedValueId: "extracted_expense_chemist",
        startMs: 14000,
        endMs: 28000,
        quote: "Spent forty two dollars at Chemist Warehouse for vitamins.",
        segmentIds: ["segment_morning_2"],
        confidence: 0.91,
    },
];

export function getCaptureAspectIds(captureId: string): AspectKey[] {
    return CAPTURE_SEEDS.find((c) => c.id === captureId)?.aspectIds ?? [];
}

function cloneSeedStore<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

const INITIAL_CAPTURE_SEEDS = cloneSeedStore(CAPTURE_SEEDS);
const INITIAL_VOICE_LOG_SEEDS = cloneSeedStore(VOICE_LOG_SEEDS);
const INITIAL_TRANSCRIPT_SEGMENT_SEEDS = cloneSeedStore(TRANSCRIPT_SEGMENT_SEEDS);
const INITIAL_EXTRACTION_RUN_SEEDS = cloneSeedStore(EXTRACTION_RUN_SEEDS);
const INITIAL_EXTRACTED_VALUE_SEEDS = cloneSeedStore(EXTRACTED_VALUE_SEEDS);
const INITIAL_SOURCE_ANCHOR_SEEDS = cloneSeedStore(SOURCE_ANCHOR_SEEDS);

export function resetCaptureStubStoreForTests(): void {
    CAPTURE_SEEDS.splice(
        0,
        CAPTURE_SEEDS.length,
        ...cloneSeedStore(INITIAL_CAPTURE_SEEDS),
    );
    VOICE_LOG_SEEDS.splice(
        0,
        VOICE_LOG_SEEDS.length,
        ...cloneSeedStore(INITIAL_VOICE_LOG_SEEDS),
    );
    TRANSCRIPT_SEGMENT_SEEDS.splice(
        0,
        TRANSCRIPT_SEGMENT_SEEDS.length,
        ...cloneSeedStore(INITIAL_TRANSCRIPT_SEGMENT_SEEDS),
    );
    EXTRACTION_RUN_SEEDS.splice(
        0,
        EXTRACTION_RUN_SEEDS.length,
        ...cloneSeedStore(INITIAL_EXTRACTION_RUN_SEEDS),
    );
    EXTRACTED_VALUE_SEEDS.splice(
        0,
        EXTRACTED_VALUE_SEEDS.length,
        ...cloneSeedStore(INITIAL_EXTRACTED_VALUE_SEEDS),
    );
    SOURCE_ANCHOR_SEEDS.splice(
        0,
        SOURCE_ANCHOR_SEEDS.length,
        ...cloneSeedStore(INITIAL_SOURCE_ANCHOR_SEEDS),
    );
}
