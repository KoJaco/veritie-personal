"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { EvidenceIndexEntry } from "@veritie/sdk";

import {
  mergeResolvedHighlights,
  resolveSegmentsForEntry,
} from "@/lib/evidence-index/segment-resolve";
import {
  findTranscriptEvidenceHighlightRange,
  renderHighlightedText,
  type HighlightRange,
} from "@/lib/evidence-index/quote-highlight";
import type { IndexedTranscriptArtifact } from "@/lib/evidence-index/types";
import { cn } from "@/lib/utils";

import {
  IndexedResultStagger,
  IndexedResultStaggerItem,
  useEntranceAnimationEnabled,
} from "./indexed-result-motion";

function lineHighlightRange(
  lineStart: number,
  lineText: string,
  fullRange: HighlightRange | null,
): HighlightRange | null {
  if (!fullRange) {
    return null;
  }

  const lineEnd = lineStart + lineText.length;
  if (fullRange.end <= lineStart || fullRange.start >= lineEnd) {
    return null;
  }

  return {
    start: Math.max(0, fullRange.start - lineStart),
    end: Math.min(lineText.length, fullRange.end - lineStart),
  };
}

function buildLineOffsets(lines: string[]): number[] {
  let offset = 0;

  return lines.map((line, index) => {
    const start = offset;
    offset += line.length + (index < lines.length - 1 ? 1 : 0);
    return start;
  });
}

function TranscriptLine({
  line,
  highlightRange,
  evidenceId,
}: {
  line: string;
  highlightRange: HighlightRange | null;
  evidenceId?: boolean;
}) {
  const parts = renderHighlightedText(line, highlightRange);

  return (
    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">
      {parts.map((part, index) =>
        part.highlighted ? (
          <mark
            id={evidenceId ? "active-transcript-evidence" : undefined}
            key={index}
            className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground underline decoration-primary/40 decoration-2 underline-offset-2"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </p>
  );
}

function SegmentRow({
  segmentKey,
  startMs,
  endMs,
  text,
  highlightRange,
  highlightWholeSegment,
  isActive,
  ariaLabel,
}: {
  segmentKey: string;
  startMs: number;
  endMs: number;
  text: string;
  highlightRange: HighlightRange | null;
  highlightWholeSegment: boolean;
  isActive: boolean;
  ariaLabel?: string;
}) {
  const parts = renderHighlightedText(text, highlightRange);

  return (
    <div
      id={segmentKey}
      aria-current={isActive ? "true" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "border-l-2 pl-3 text-sm transition-colors",
        isActive
          ? "border-primary bg-primary/5"
          : "border-border/60",
        highlightWholeSegment && isActive && "ring-1 ring-primary/30",
      )}
    >
      <span className="text-xs text-muted-foreground">
        {Math.round(startMs / 1000)}s–{Math.round(endMs / 1000)}s
      </span>
      <p>
        {parts.map((part, index) =>
          part.highlighted ? (
            <mark
              key={index}
              className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground underline decoration-primary/40 decoration-2 underline-offset-2"
            >
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

export function IndexedTranscriptPanel({
  transcript,
  activeEntry,
  activePath,
  animateEntrance = false,
  showTimingsSection = true,
  timingsExpanded = false,
}: {
  transcript: IndexedTranscriptArtifact | null;
  activeEntry: EvidenceIndexEntry | null;
  activePath: string | null;
  animateEntrance?: boolean;
  showTimingsSection?: boolean;
  timingsExpanded?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [segmentsOpen, setSegmentsOpen] = useState(timingsExpanded);
  const segments = useMemo(
    () => transcript?.segments ?? [],
    [transcript?.segments],
  );

  useEffect(() => {
    if (timingsExpanded) {
      setSegmentsOpen(true);
    }
  }, [timingsExpanded]);

  const highlights = useMemo(() => {
    if (!activeEntry) {
      return [];
    }
    return mergeResolvedHighlights(
      resolveSegmentsForEntry(segments, activeEntry),
    );
  }, [activeEntry, segments]);

  const highlightByIndex = useMemo(() => {
    const map = new Map<
      number,
      { highlightRange: HighlightRange | null; highlightWholeSegment: boolean }
    >();
    for (const highlight of highlights) {
      map.set(highlight.segmentIndex, {
        highlightRange: highlight.highlightRange,
        highlightWholeSegment: highlight.highlightWholeSegment,
      });
    }
    return map;
  }, [highlights]);

  const fullTranscriptText = useMemo(() => {
    if (transcript?.text?.trim()) {
      return transcript.text;
    }

    return segments
      .map((segment) => segment.text?.trim())
      .filter((text): text is string => Boolean(text))
      .join(" ");
  }, [segments, transcript]);

  const fullTranscriptHighlightRange = useMemo(() => {
    if (!activeEntry || activeEntry.status === "unresolved") {
      return null;
    }

    return findTranscriptEvidenceHighlightRange(
      fullTranscriptText,
      activeEntry.quote,
      highlights
        .map((highlight) => highlight.segment.text)
        .filter((text): text is string => Boolean(text)),
    );
  }, [activeEntry, fullTranscriptText, highlights]);

  const fullTranscriptParts = useMemo(
    () =>
      renderHighlightedText(fullTranscriptText, fullTranscriptHighlightRange),
    [fullTranscriptHighlightRange, fullTranscriptText],
  );

  const transcriptLines = useMemo(
    () => (fullTranscriptText ? fullTranscriptText.split("\n") : []),
    [fullTranscriptText],
  );

  const transcriptLineOffsets = useMemo(
    () => buildLineOffsets(transcriptLines),
    [transcriptLines],
  );

  const shouldAnimateLines = useEntranceAnimationEnabled(
    animateEntrance,
    Boolean(fullTranscriptText),
  );

  const evidenceLineIndex = useMemo(() => {
    if (!fullTranscriptHighlightRange) {
      return -1;
    }

    return transcriptLines.findIndex((line, lineIndex) =>
      lineHighlightRange(
        transcriptLineOffsets[lineIndex] ?? 0,
        line,
        fullTranscriptHighlightRange,
      ) !== null,
    );
  }, [
    fullTranscriptHighlightRange,
    transcriptLineOffsets,
    transcriptLines,
  ]);

  useEffect(() => {
    if (!fullTranscriptHighlightRange || !containerRef.current) {
      return;
    }

    const element = containerRef.current.querySelector(
      "#active-transcript-evidence",
    );
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [activeEntry, activePath, fullTranscriptHighlightRange]);

  if (!transcript) {
    return (
      <p className="text-sm text-muted-foreground">No transcript available.</p>
    );
  }

  return (
    <div ref={containerRef} className="grid gap-3">
      {fullTranscriptText ? (
        shouldAnimateLines ? (
          <IndexedResultStagger className="grid gap-1">
            {transcriptLines.map((line, lineIndex) => {
              const lineHighlight = lineHighlightRange(
                transcriptLineOffsets[lineIndex] ?? 0,
                line,
                fullTranscriptHighlightRange,
              );
              return (
                <IndexedResultStaggerItem key={`line-${lineIndex}`}>
                  <TranscriptLine
                    line={line}
                    highlightRange={lineHighlight}
                    evidenceId={lineIndex === evidenceLineIndex}
                  />
                </IndexedResultStaggerItem>
              );
            })}
            {segments.length && showTimingsSection ? (
              <IndexedResultStaggerItem>
                <div>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-1.5 text-left text-sm font-medium transition-colors",
                    )}
                    onClick={() => setSegmentsOpen((open) => !open)}
                    aria-expanded={segmentsOpen}
                  >
                    <span>
                      Timings
                      <span className="ml-2 font-normal text-muted-foreground">
                        ({segments.length})
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        segmentsOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {segmentsOpen ? (
                    <div className="mt-2 grid gap-2">
                    {segments.map((segment, index) => {
                      const highlight = highlightByIndex.get(index);
                      const isActive = highlightByIndex.has(index);
                      const segmentKey = `segment-${index}`;

                      return (
                        <SegmentRow
                          key={segment.id ?? segmentKey}
                          segmentKey={segmentKey}
                          startMs={segment.start_ms}
                          endMs={segment.end_ms}
                          text={segment.text ?? ""}
                          highlightRange={highlight?.highlightRange ?? null}
                          highlightWholeSegment={
                            highlight?.highlightWholeSegment ?? false
                          }
                          isActive={isActive}
                          ariaLabel={
                            isActive && activeEntry?.quote
                              ? `Evidence for ${activePath}: ${activeEntry.quote}`
                              : undefined
                          }
                        />
                      );
                    })}
                    </div>
                  ) : null}
                </div>
              </IndexedResultStaggerItem>
            ) : null}
          </IndexedResultStagger>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">
            {fullTranscriptParts.map((part, index) =>
              part.highlighted ? (
                <mark
                  id="active-transcript-evidence"
                  key={index}
                  className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground underline decoration-primary/40 decoration-2 underline-offset-2"
                >
                  {part.text}
                </mark>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </p>
        )
      ) : null}

      {segments.length && showTimingsSection && !shouldAnimateLines ? (
        <div>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-1.5 text-left text-sm font-medium transition-colors",
            )}
            onClick={() => setSegmentsOpen((open) => !open)}
            aria-expanded={segmentsOpen}
          >
            <span>
              Timings
              <span className="ml-2 font-normal text-muted-foreground">
                ({segments.length})
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                segmentsOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {segmentsOpen ? (
            <div className="mt-2 grid gap-2">
            {segments.map((segment, index) => {
              const highlight = highlightByIndex.get(index);
              const isActive = highlightByIndex.has(index);
              const segmentKey = `segment-${index}`;

              return (
                <SegmentRow
                  key={segment.id ?? segmentKey}
                  segmentKey={segmentKey}
                  startMs={segment.start_ms}
                  endMs={segment.end_ms}
                  text={segment.text ?? ""}
                  highlightRange={highlight?.highlightRange ?? null}
                  highlightWholeSegment={
                    highlight?.highlightWholeSegment ?? false
                  }
                  isActive={isActive}
                  ariaLabel={
                    isActive && activeEntry?.quote
                      ? `Evidence for ${activePath}: ${activeEntry.quote}`
                      : undefined
                  }
                />
              );
            })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
