/**
 * Import voice log JSON bundles into stub stores (development only).
 * Usage: npx ts-node scripts/import-voice-logs.ts path/to/bundle.json
 */
import { readFileSync } from "node:fs";
import type { JobDetailResponse } from "@veritie/sdk";
import { mapVeritieJobToCaptureBundle } from "../lib/capture/map-veritie-job";
import { appendCaptureFromJob } from "../lib/data-source/captures-read-model";
import { appendTimelineEvents } from "../lib/data-source/timeline-read-model";

const inputPath = process.argv[2];
if (!inputPath) {
    console.error("Usage: import-voice-logs.ts <bundle.json>");
    process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8")) as {
    job: JobDetailResponse;
    captureId?: string;
};

const captureId = raw.captureId ?? `capture_import_${Date.now()}`;
const bundle = mapVeritieJobToCaptureBundle(raw.job, captureId);
appendCaptureFromJob({
    capture: bundle.capture,
    voiceLog: bundle.voiceLog,
    segments: bundle.segments,
    extractedValues: bundle.extractedValues,
});
appendTimelineEvents(bundle.timelineEvents);

console.log(
    `Imported capture ${bundle.capture.id} with ${bundle.timelineEvents.length} timeline events`,
);
