import { describe, expect, it } from "@jest/globals";
import type { EvidenceIndexArtifact } from "@veritie/sdk";

import {
    buildCaptureSegmentId,
    remapIndexArtifactSegmentIds,
} from "@/lib/capture/capture-segment-ids";

describe("lib/capture/capture-segment-ids", () => {
    it("builds capture-scoped segment ids", () => {
        expect(buildCaptureSegmentId("capture_abc", 2)).toBe(
            "segment_capture_abc_2",
        );
    });

    it("remaps Veritie segment-{index} ids for persistence", () => {
        const index: EvidenceIndexArtifact = {
            status: "completed",
            builder_version: "v1",
            entries: [
                {
                    path: "title",
                    status: "resolved",
                    segment_ids: ["segment-0", "segment-2"],
                },
            ],
        };

        const remapped = remapIndexArtifactSegmentIds(index, "capture_abc");
        expect(remapped?.entries[0]?.segment_ids).toEqual([
            "segment_capture_abc_0",
            "segment_capture_abc_2",
        ]);
    });
});
