import type { LensWindowPreset } from "@/lib/lens";
import type { ScopeCoverageTimelineStub } from "./types";
import { getScopeCoverageTimelineStub } from "./scope-coverage-timeline";

/** @deprecated Use getScopeCoverageTimelineStub */
export function getSoc2TypeIiTimelineStub(
    windowPreset: LensWindowPreset,
): ScopeCoverageTimelineStub {
    return getScopeCoverageTimelineStub(windowPreset);
}
