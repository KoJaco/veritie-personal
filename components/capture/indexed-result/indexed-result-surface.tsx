"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import type { EvidenceIndexEntry } from "@/lib/evidence-index/types";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  buildIndexLookup,
  getEntriesForPath,
} from "@/lib/evidence-index/index-lookup";
import {
  INITIAL_INTERACTION_STATE,
  type IndexedExtractionProps,
} from "@/lib/evidence-index/types";
import { cn } from "@/lib/utils";

import { IndexStatusBanner } from "./index-status-banner";
import { IndexedAudioPlayer } from "./indexed-audio-player";
import { IndexedExtractionTree } from "./indexed-extraction-tree";
import { IndexedResultAnimatedSection } from "./indexed-result-motion";
import { IndexedTranscriptPanel } from "./indexed-transcript-panel";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { CodeIcon, EyeIcon, ListIcon, PilcrowIcon, type LucideIcon } from "lucide-react";

function ViewModeToggleButton({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: [
    { value: string; icon: LucideIcon; title: string },
    { value: string; icon: LucideIcon; title: string },
  ];
}) {
  const activeIndex = options.findIndex((option) => option.value === value);
  const current = options[activeIndex === -1 ? 0 : activeIndex];
  const next = options[(activeIndex === -1 ? 0 : activeIndex + 1) % options.length];
  const Icon = current.icon;

  return (
    <Button
      type="button"
      variant="outline"
      className="h-6 text-xs font-medium shadow-none"
      aria-label={`Switch to ${next.title} view`}
      onClick={() => onValueChange(next.value)}
    >
      <Icon className="size-4 shrink-0" />
      <span>{current.title}</span>
    </Button>
  );
}

function isCoarsePointerDevice() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

function JsonFallback({ value }: { value: Record<string, unknown> }) {
  return (
    <pre className={cn(SURFACE_CLASS, "max-h-96 overflow-auto p-3 text-xs")}>
      {JSON.stringify(value, null, "\t")}
    </pre>
  );
}

export function IndexedResultSurface({
  extraction,
  index,
  transcript,
  audioUrl,
  indexingState,
  className,
  expectAudio = false,
  showIndexingBanner = false,
  showExtraction = true,
  layout = "default",
  glossaryLabels,
  captureId,
  extractedValues,
  onExtractedValueSaved,
}: IndexedExtractionProps & {
  indexingState?: string | null;
  className?: string;
  expectAudio?: boolean;
  showIndexingBanner?: boolean;
  showExtraction?: boolean;
  layout?: "default" | "embedded";
  glossaryLabels?: Record<string, string>;
  captureId?: string;
  extractedValues?: import("@/lib/stubs/capture-stubs").ExtractedValueStub[];
  onExtractedValueSaved?: () => void;
}) {
  const isEmbedded = layout === "embedded";
  const [transcriptViewMode, setTranscriptViewMode] = useState<
    "paragraph" | "timings"
  >("paragraph");
  const [extractionViewMode, setExtractionViewMode] = useState<
    "readable" | "json"
  >("readable");
  const showExtractionJson = extractionViewMode === "json";
  const [interaction, setInteraction] = useState(INITIAL_INTERACTION_STATE);
  const [entryIndexByPath, setEntryIndexByPath] = useState<
    Record<string, number>
  >({});

  const indexEntries = useMemo(() => index?.entries ?? [], [index?.entries]);

  const lookup = useMemo(
    () => buildIndexLookup(indexEntries),
    [indexEntries],
  );

  const activeEntry = useMemo(() => {
    if (!interaction.activePath) {
      return null;
    }
    const entries = getEntriesForPath(lookup, interaction.activePath);
    const entryIndex = entryIndexByPath[interaction.activePath] ?? 0;
    return entries[entryIndex] ?? entries[0] ?? null;
  }, [entryIndexByPath, interaction.activePath, lookup]);

  const pendingSeekLabel =
    activeEntry &&
      activeEntry.status !== "unresolved" &&
      typeof activeEntry.start_ms === "number"
      ? activeEntry.quote ?? interaction.activePath
      : null;

  const handleFocusPath = useCallback((path: string, entryIndex: number) => {
    setInteraction((current) => ({
      ...current,
      hoverPath: path,
      hoverEntryIndex: entryIndex,
    }));
  }, []);

  const handleHoverPath = useCallback(
    (path: string | null, entryIndex: number) => {
      setInteraction((current) => ({
        ...current,
        hoverPath: path,
        hoverEntryIndex: entryIndex,
      }));
    },
    [],
  );

  const handleActivatePath = useCallback(
    (path: string, entry: EvidenceIndexEntry) => {
      const entryIndex = entryIndexByPath[path] ?? 0;
      setInteraction((current) => ({
        ...current,
        activePath: path,
        activeEntryIndex: entryIndex,
        hoverPath: path,
        hoverEntryIndex: entryIndex,
        requestedSeekMs:
          entry.status !== "unresolved" &&
            typeof entry.start_ms === "number" &&
            !isCoarsePointerDevice()
            ? entry.start_ms
            : current.requestedSeekMs,
      }));
    },
    [entryIndexByPath],
  );

  const handleCycleEntry = useCallback(
    (path: string) => {
      const entries = getEntriesForPath(lookup, path);
      if (entries.length <= 1) {
        return;
      }

      setEntryIndexByPath((current) => {
        const nextIndex = ((current[path] ?? 0) + 1) % entries.length;
        return { ...current, [path]: nextIndex };
      });
      setInteraction((current) => ({
        ...current,
        activePath: path,
        activeEntryIndex:
          ((entryIndexByPath[path] ?? 0) + 1) % entries.length,
      }));
    },
    [entryIndexByPath, lookup],
  );

  const handleSeekHandled = useCallback(() => {
    setInteraction((current) => ({
      ...current,
      requestedSeekMs: null,
    }));
  }, []);

  const handleMobileSeek = useCallback(() => {
    if (
      !activeEntry ||
      activeEntry.status === "unresolved" ||
      typeof activeEntry.start_ms !== "number"
    ) {
      return;
    }

    setInteraction((current) => ({
      ...current,
      requestedSeekMs: activeEntry.start_ms ?? null,
    }));
  }, [activeEntry]);

  const hasExtraction = Object.keys(extraction).length > 0;
  const hasTranscript = Boolean(transcript?.text || transcript?.segments?.length);
  const hasTimedSegments = Boolean(transcript?.segments?.length);
  const isIndexing =
    indexingState === "pending" || indexingState === "running";
  const showAudioSection =
    Boolean(audioUrl) || (expectAudio && !isEmbedded);
  const shouldRender =
    hasExtraction ||
    hasTranscript ||
    expectAudio ||
    Boolean(index) ||
    (showIndexingBanner &&
      (isIndexing || indexingState === "failed" || index?.status === "failed"));

  if (!shouldRender) {
    return (
      <p className="text-sm text-muted-foreground">
        Results will appear here once transcript and extraction complete.
      </p>
    );
  }

  const showTranscriptSection = hasTranscript || !showIndexingBanner;
  const showExtractionSection =
    showExtraction && (hasExtraction || !showIndexingBanner);
  const hasPrimaryColumn =
    showAudioSection || (showTranscriptSection && hasTranscript);
  const useSplitLayout =
    !isEmbedded && showExtractionSection && hasPrimaryColumn;

  const audioSection = showAudioSection ? (
    <IndexedResultAnimatedSection key="audio-section" delay={0}>
      {!isEmbedded ? <h3 className="text-sm font-semibold">Audio</h3> : null}
      {audioUrl ? (
        <>
          <IndexedAudioPlayer
            audioUrl={audioUrl}
            requestedSeekMs={interaction.requestedSeekMs}
            onSeekHandled={handleSeekHandled}
          />
          {isCoarsePointerDevice() && pendingSeekLabel ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleMobileSeek}
            >
              Seek to selected evidence
            </Button>
          ) : null}
        </>
      ) : (
        <Skeleton className="mt-3 h-12 w-full rounded-lg" />
      )}
    </IndexedResultAnimatedSection>
  ) : null;

  const transcriptSection =
    showTranscriptSection && hasTranscript ? (
      <IndexedResultAnimatedSection
        key="transcript-section"
        delay={showAudioSection ? 0.06 : 0}
      >
        {!isEmbedded ? (
          <div className="flex items-center gap-3 justify-between">
            <h3 className="text-sm font-semibold">Transcript</h3>
            {hasTimedSegments ? (
              <ViewModeToggleButton
                value={transcriptViewMode}
                onValueChange={(value) =>
                  setTranscriptViewMode(
                    value === "timings" ? "timings" : "paragraph",
                  )
                }
                options={[
                  {
                    value: "paragraph",
                    icon: PilcrowIcon,
                    title: "Paragraph",
                  },
                  {
                    value: "timings",
                    icon: ListIcon,
                    title: "Timings",
                  },
                ]}
              />
            ) : null}
          </div>
        ) : null}
        <div className={cn(SURFACE_CLASS, "p-3 mt-1.5")}>

          <IndexedTranscriptPanel
            transcript={transcript}
            activeEntry={activeEntry}
            activePath={interaction.activePath}
            animateEntrance
            showTimingsSection={false}
            viewMode={transcriptViewMode}
          />
        </div>
      </IndexedResultAnimatedSection>
    ) : null;

  const extractionSection = showExtractionSection ? (
    <IndexedResultAnimatedSection
      key="extraction-section"
      className="relative grid gap-3"
      delay={
        (showAudioSection ? 0.06 : 0) +
        (showTranscriptSection && hasTranscript ? 0.06 : 0)
      }
    >
      <div className="flex items-center gap-3 justify-between">
        <h3 className="text-sm font-semibold">Extraction</h3>
        {hasExtraction ? (
          <ViewModeToggleButton
            value={extractionViewMode}
            onValueChange={(value) =>
              setExtractionViewMode(value === "json" ? "json" : "readable")
            }
            options={[
              {
                value: "readable",
                icon: EyeIcon,
                title: "Readable",
              },
              {
                value: "json",
                icon: CodeIcon,
                title: "JSON",
              },
            ]}
          />
        ) : null}
      </div>
      {hasExtraction ? (
        showExtractionJson ? (
          <JsonFallback value={extraction} />
        ) : (
          <IndexedExtractionTree
            extraction={extraction}
            indexEntries={indexEntries}
            activePath={interaction.activePath}
            hoverPath={interaction.hoverPath}
            activeEntryIndex={interaction.activeEntryIndex}
            entryIndexByPath={entryIndexByPath}
            glossaryLabels={glossaryLabels}
            captureId={captureId}
            extractedValues={extractedValues}
            onExtractedValueSaved={onExtractedValueSaved}
            onFocusPath={handleFocusPath}
            onHoverPath={handleHoverPath}
            onActivatePath={handleActivatePath}
            onCycleEntry={handleCycleEntry}
            animateEntrance
          />
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          No extraction payload yet.
        </p>
      )}
    </IndexedResultAnimatedSection>
  ) : null;

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <IndexStatusBanner
        indexStatus={index?.status ?? null}
        indexingState={indexingState ?? null}
        errorClass={index?.error_class ?? null}
      />

      <div
        className={cn(
          "grid gap-3",
          useSplitLayout && "lg:grid-cols-2 lg:items-start lg:gap-6",
        )}
      >
        {hasPrimaryColumn ? (
          <div className="grid min-w-0 gap-3 lg:pr-6">
            <AnimatePresence initial={false}>{audioSection}</AnimatePresence>

            {showAudioSection &&
              showTranscriptSection &&
              hasTranscript &&
              !isEmbedded ? (
              <Separator className="my-3 opacity-50" />
            ) : null}

            <AnimatePresence initial={false}>
              {transcriptSection}
            </AnimatePresence>
          </div>
        ) : null}

        {showExtractionSection ? (
          <div className="grid min-w-0 gap-3">
            {useSplitLayout ? (
              <Separator className="my-3 opacity-50 lg:hidden" />
            ) : null}
            {!useSplitLayout &&
              showTranscriptSection &&
              hasTranscript &&
              hasPrimaryColumn &&
              !isEmbedded ? (
              <Separator className="my-3 opacity-50" />
            ) : null}

            <AnimatePresence initial={false}>
              {extractionSection}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </div>
  );
}
