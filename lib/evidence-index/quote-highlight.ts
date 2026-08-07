/** Normalize text for fuzzy quote matching. */
export function normalizeQuoteText(value: string | null | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type HighlightRange = {
  start: number;
  end: number;
};

/**
 * Locate a quote phrase within segment text. Returns character offsets in the
 * original segment text, or null when no safe match is found.
 */
export function findQuoteHighlightRange(
  segmentText: string | null | undefined,
  quote: string | null | undefined,
): HighlightRange | null {
  if (typeof segmentText !== "string" || typeof quote !== "string") {
    return null;
  }

  const normalizedQuote = normalizeQuoteText(quote);
  const normalizedSegment = normalizeQuoteText(segmentText);
  if (!normalizedQuote || !normalizedSegment) {
    return null;
  }

  const directIndex = normalizedSegment.indexOf(normalizedQuote);
  if (directIndex < 0) {
    return null;
  }

  // Map normalized index back to original text when lengths align closely.
  const words = normalizedQuote.split(" ");
  const firstWord = words[0];
  if (!firstWord) {
    return null;
  }

  const lowerSegment = segmentText.toLowerCase();
  const wordIndex = lowerSegment.indexOf(firstWord);
  if (wordIndex < 0) {
    return null;
  }

  let end = wordIndex;
  for (const word of words) {
    const nextIndex = lowerSegment.indexOf(word, end);
    if (nextIndex < 0) {
      return { start: wordIndex, end: segmentText.length };
    }
    end = nextIndex + word.length;
  }

  return { start: wordIndex, end: Math.min(end, segmentText.length) };
}

/**
 * Resolve an evidence highlight against the stable full-transcript text. The
 * canonical quote is preferred; matching segment text is a conservative
 * fallback when provider punctuation or wording prevents a direct match.
 */
export function findTranscriptEvidenceHighlightRange(
  transcriptText: string,
  quote: string | null | undefined,
  fallbackSegmentTexts: string[] = [],
): HighlightRange | null {
  const quoteRange = findQuoteHighlightRange(transcriptText, quote);
  if (quoteRange) {
    return quoteRange;
  }

  for (const segmentText of fallbackSegmentTexts) {
    const segmentRange = findQuoteHighlightRange(transcriptText, segmentText);
    if (segmentRange) {
      return segmentRange;
    }
  }

  return null;
}

export function renderHighlightedText(
  text: string,
  range: HighlightRange | null,
): Array<{ text: string; highlighted: boolean }> {
  if (!range || range.start >= range.end) {
    return [{ text, highlighted: false }];
  }

  return [
    { text: text.slice(0, range.start), highlighted: false },
    { text: text.slice(range.start, range.end), highlighted: true },
    { text: text.slice(range.end), highlighted: false },
  ].filter((part) => part.text.length > 0);
}

export type TaggedHighlightRange = HighlightRange & {
  primary?: boolean;
};

function mergeTaggedHighlightRanges(
  ranges: TaggedHighlightRange[],
): TaggedHighlightRange[] {
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: TaggedHighlightRange[] = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
      continue;
    }

    last.end = Math.max(last.end, range.end);
    last.primary = last.primary || range.primary;
  }

  return merged;
}

export function collectTranscriptHighlightRanges(
  transcriptText: string,
  quotes: Array<{ quote: string; primary?: boolean }>,
  fallbackSegmentTexts: string[] = [],
): TaggedHighlightRange[] {
  const ranges: TaggedHighlightRange[] = [];

  for (const { quote, primary } of quotes) {
    const trimmed = quote.trim();
    if (!trimmed) {
      continue;
    }

    const range = findTranscriptEvidenceHighlightRange(
      transcriptText,
      trimmed,
      fallbackSegmentTexts,
    );
    if (range) {
      ranges.push({ ...range, primary });
    }
  }

  return mergeTaggedHighlightRanges(ranges);
}

export function renderMultiHighlightedText(
  text: string,
  ranges: TaggedHighlightRange[],
): Array<{ text: string; highlighted: boolean; primary?: boolean }> {
  if (ranges.length === 0) {
    return [{ text, highlighted: false }];
  }

  const parts: Array<{ text: string; highlighted: boolean; primary?: boolean }> =
    [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      parts.push({
        text: text.slice(cursor, range.start),
        highlighted: false,
      });
    }

    if (range.end > range.start) {
      parts.push({
        text: text.slice(range.start, range.end),
        highlighted: true,
        primary: range.primary,
      });
    }

    cursor = Math.max(cursor, range.end);
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlighted: false });
  }

  return parts.filter((part) => part.text.length > 0);
}
