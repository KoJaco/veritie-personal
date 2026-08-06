import type { EvidenceIndexEntry } from "@veritie/sdk";

import { findQuoteHighlightRange, type HighlightRange } from "./quote-highlight";
import type { IndexedTranscriptSegment } from "./types";

export type ResolvedSegmentHighlight = {
  segment: IndexedTranscriptSegment;
  segmentIndex: number;
  highlightRange: HighlightRange | null;
  highlightWholeSegment: boolean;
};

function segmentsOverlap(
  segment: IndexedTranscriptSegment,
  startMs: number,
  endMs: number,
): boolean {
  return segment.start_ms < endMs && segment.end_ms > startMs;
}

function resolveBySegmentIds(
  segments: IndexedTranscriptSegment[],
  segmentIds: string[],
  quote: string | undefined,
): ResolvedSegmentHighlight[] {
  const idSet = new Set(segmentIds);
  const resolved: ResolvedSegmentHighlight[] = [];

  segments.forEach((segment, segmentIndex) => {
    if (!segment.id || !idSet.has(segment.id)) {
      return;
    }

    const highlightRange =
      quote && segment.text
        ? findQuoteHighlightRange(segment.text, quote)
        : null;

    resolved.push({
      segment,
      segmentIndex,
      highlightRange,
      highlightWholeSegment: !highlightRange,
    });
  });

  return resolved;
}

function resolveByTimeRange(
  segments: IndexedTranscriptSegment[],
  startMs: number,
  endMs: number,
  quote: string | undefined,
): ResolvedSegmentHighlight[] {
  const resolved: ResolvedSegmentHighlight[] = [];

  segments.forEach((segment, segmentIndex) => {
    if (!segmentsOverlap(segment, startMs, endMs)) {
      return;
    }

    const highlightRange =
      quote && segment.text
        ? findQuoteHighlightRange(segment.text, quote)
        : null;

    resolved.push({
      segment,
      segmentIndex,
      highlightRange,
      highlightWholeSegment: !highlightRange,
    });
  });

  return resolved;
}

function resolveByQuoteScan(
  segments: IndexedTranscriptSegment[],
  quote: string,
): ResolvedSegmentHighlight[] {
  const resolved: ResolvedSegmentHighlight[] = [];

  segments.forEach((segment, segmentIndex) => {
    if (!segment.text) {
      return;
    }

    const highlightRange = findQuoteHighlightRange(segment.text, quote);
    if (!highlightRange) {
      return;
    }

    resolved.push({
      segment,
      segmentIndex,
      highlightRange,
      highlightWholeSegment: false,
    });
  });

  return resolved;
}

export function resolveSegmentsForEntry(
  segments: IndexedTranscriptSegment[],
  entry: EvidenceIndexEntry,
): ResolvedSegmentHighlight[] {
  if (entry.status === "unresolved") {
    return [];
  }

  const quote = entry.quote;

  if (entry.segment_ids.length > 0) {
    const byId = resolveBySegmentIds(segments, entry.segment_ids, quote);
    if (byId.length > 0) {
      return byId;
    }
  }

  if (
    typeof entry.start_ms === "number" &&
    typeof entry.end_ms === "number"
  ) {
    const byTime = resolveByTimeRange(
      segments,
      entry.start_ms,
      entry.end_ms,
      quote,
    );
    if (byTime.length > 0) {
      return byTime;
    }
  }

  if (typeof quote === "string" && quote.trim() !== "") {
    return resolveByQuoteScan(segments, quote);
  }

  return [];
}

export function mergeResolvedHighlights(
  highlights: ResolvedSegmentHighlight[],
): ResolvedSegmentHighlight[] {
  const byIndex = new Map<number, ResolvedSegmentHighlight>();

  for (const highlight of highlights) {
    const existing = byIndex.get(highlight.segmentIndex);
    if (!existing) {
      byIndex.set(highlight.segmentIndex, highlight);
      continue;
    }

    if (existing.highlightWholeSegment && !highlight.highlightWholeSegment) {
      byIndex.set(highlight.segmentIndex, highlight);
    }
  }

  return [...byIndex.values()].sort(
    (left, right) => left.segmentIndex - right.segmentIndex,
  );
}
