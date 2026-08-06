"use client";

import { AlignLeft, Braces } from "lucide-react";
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
}: IndexedExtractionProps & {
  indexingState?: string | null;
  className?: string;
  expectAudio?: boolean;
  showIndexingBanner?: boolean;
  showExtraction?: boolean;
  layout?: "default" | "embedded";
}) {
  const isEmbedded = layout === "embedded";
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

  return (
    <div className={cn("grid gap-4", className)}>
      <IndexStatusBanner
        indexStatus={index?.status ?? null}
        indexingState={indexingState ?? null}
        errorClass={index?.error_class ?? null}
      />

      <div className="grid gap-3">
        <AnimatePresence initial={false}>
          {showAudioSection ? (
            <IndexedResultAnimatedSection key="audio-section" delay={0}>
              {!isEmbedded ? (
                <h3 className="text-sm font-semibold">Audio</h3>
              ) : null}
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
          ) : null}
        </AnimatePresence>

        {showAudioSection && showTranscriptSection && !isEmbedded ? (
          <Separator className="my-3 opacity-50" />
        ) : null}

        <AnimatePresence initial={false}>
          {showTranscriptSection && hasTranscript ? (
            <IndexedResultAnimatedSection
              key="transcript-section"
              delay={showAudioSection ? 0.06 : 0}
            >
              {!isEmbedded ? (
                <h3 className="text-sm font-semibold">Transcript</h3>
              ) : null}
              <IndexedTranscriptPanel
                transcript={transcript}
                activeEntry={activeEntry}
                activePath={interaction.activePath}
                animateEntrance
              />
            </IndexedResultAnimatedSection>
          ) : null}
        </AnimatePresence>

        {showTranscriptSection && showExtractionSection && !isEmbedded ? (
          <Separator className="my-3 opacity-50" />
        ) : null}

        <AnimatePresence initial={false}>
          {showExtractionSection ? (
            <IndexedResultAnimatedSection
              key="extraction-section"
              className="relative grid gap-3"
              delay={
                (showAudioSection ? 0.06 : 0) +
                (showTranscriptSection && hasTranscript ? 0.06 : 0)
              }
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">Extraction</h3>
                {hasExtraction ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label={
                      showExtractionJson
                        ? "Show readable extraction view"
                        : "Show JSON extraction view"
                    }
                    title={
                      showExtractionJson
                        ? "Show readable view"
                        : "Show raw JSON"
                    }
                    onClick={() =>
                      setExtractionViewMode((current) =>
                        current === "json" ? "readable" : "json",
                      )
                    }
                  >
                    {showExtractionJson ? <AlignLeft /> : <Braces />}
                  </Button>
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
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
