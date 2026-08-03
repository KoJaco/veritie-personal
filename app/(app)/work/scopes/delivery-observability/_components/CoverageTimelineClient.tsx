"use client";

import { useMemo, useState } from "react";
import { CheckCoverageSnapshotList } from "./CheckCoverageSnapshotList";
import { CoverageBar } from "./CoverageBar";
import { buildCoverageModel } from "../_lib/model";
import { SnapshotStats } from "./SnapshotStats";
import { WindowPresetSelector } from "./WindowPresetSelector";
import { ScopeSection } from "../../_components/ScopeShared";
import { formatShortDate } from "@/lib/format/date";
import { type LensWindowPreset } from "@/lib/lens";
import { getScopeCoverageTimelineStub } from "@/lib/stubs";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export function CoverageTimelineClient() {
    const customWindowStub = useMemo(
        () => getScopeCoverageTimelineStub("custom").window,
        [],
    );

    const [windowPreset, setWindowPreset] =
        useState<LensWindowPreset>("90d");
    const [customStart, setCustomStart] = useState<string | undefined>(
        customWindowStub.start,
    );
    const [customEnd, setCustomEnd] = useState<string | undefined>(
        customWindowStub.end,
    );

    const timeline = useMemo(
        () => getScopeCoverageTimelineStub(windowPreset),
        [windowPreset],
    );
    const windowStart =
        windowPreset === "custom"
            ? (customStart ?? timeline.window.start)
            : timeline.window.start;
    const windowEnd =
        windowPreset === "custom"
            ? (customEnd ?? timeline.window.end)
            : timeline.window.end;

    const model = useMemo(
        () => buildCoverageModel(windowStart, windowEnd, timeline.gaps),
        [windowEnd, windowStart, timeline.gaps],
    );

    return (
        <div className="space-y-12 py-4">
            <ScopeSection
                title="Coverage Timeline"
                description={`Selected window: ${formatShortDate(model.windowStart)} - ${formatShortDate(model.windowEnd)}`}
            >
                <div className={`${SURFACE_CLASS} p-4 space-y-4`}>
                    <WindowPresetSelector
                        value={windowPreset}
                        onChange={setWindowPreset}
                        customStart={customStart}
                        customEnd={customEnd}
                        onCustomStartChange={setCustomStart}
                        onCustomEndChange={setCustomEnd}
                    />

                    <CoverageBar model={model} />

                    <SnapshotStats {...model.totals} />
                </div>
            </ScopeSection>

            <ScopeSection
                title="Check coverage snapshot"
                description="Stub coverage values by operating check in the selected window."
            >
                <div>
                    <CheckCoverageSnapshotList
                        checkCoverage={timeline.checkCoverage}
                    />
                </div>
            </ScopeSection>
        </div>
    );
}
