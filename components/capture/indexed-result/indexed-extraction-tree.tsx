"use client";

import { CornerDownRight, TriangleAlert } from "lucide-react";
import { useMemo } from "react";

import type { EvidenceIndexEntry } from "@/lib/evidence-index/types";

import {
  formatArtifactKey,
  formatPrimitiveValue,
  isEmptyArtifactValue,
  isPrimitiveArtifactValue,
  isStructuredArtifactValue,
  ReadableArtifactValue,
  shouldRenderCompactArtifactObject,
} from "@/lib/artifact-display";
import { buildIndexLookup, getEntriesForPath } from "@/lib/evidence-index/index-lookup";
import {
  pointerForIndex,
  pointerForProperty,
} from "@/lib/evidence-index/json-pointer";
import { buildExtractedValueId } from "@/lib/capture/extracted-value-path";
import { parseEntityPointerPath } from "@/lib/capture/flatten-extracted-value";
import { ExtractedValueEditorTrigger } from "@/components/extraction/ExtractedValueEditorSheet";
import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

import {
  IndexedResultStagger,
  IndexedResultStaggerItem,
} from "./indexed-result-motion";

function ExtractedEntityEditAction({
  itemPath,
  captureId,
  extractedValues,
  glossaryLabels,
  onExtractedValueSaved,
}: {
  itemPath: string;
  captureId?: string;
  extractedValues?: ExtractedValueStub[];
  glossaryLabels?: Record<string, string>;
  onExtractedValueSaved?: () => void;
}) {
  const entity = parseEntityPointerPath(itemPath);
  if (!captureId || !entity || !extractedValues) {
    return null;
  }

  const extractedValueId = buildExtractedValueId(
    captureId,
    entity.listKey,
    entity.index,
  );
  const extractedValue = extractedValues.find(
    (value) => value.id === extractedValueId,
  );
  if (!extractedValue) {
    return null;
  }

  return (
    <ExtractedValueEditorTrigger
      extractedValue={extractedValue}
      listKey={entity.listKey}
      index={entity.index}
      glossaryLabels={glossaryLabels}
      onSaved={onExtractedValueSaved}
      size="sm"
    />
  );
}

function EntryAffordance({
  entry,
  entryCount,
  entryIndex,
}: {
  entry: EvidenceIndexEntry;
  entryCount: number;
  entryIndex: number;
}) {
  if (entry.status === "unresolved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        <TriangleAlert className="size-3" aria-hidden="true" />
        Source not resolved
      </span>
    );
  }

  if (entry.status === "low_confidence" || entryCount > 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        {entryCount > 1
          && `Ambiguous source (${entryIndex + 1}/${entryCount})`}
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
      View source
    </span>
  );
}

function IndexedPrimitiveValue({
  path,
  value,
  entries,
  isActive,
  isHovered,
  activeEntryIndex,
  onFocusPath,
  onHoverPath,
  onActivatePath,
  onCycleEntry,
  inline = false,
}: {
  path: string;
  value: string | number | boolean | null;
  entries: EvidenceIndexEntry[];
  isActive: boolean;
  isHovered: boolean;
  activeEntryIndex: number;
  onFocusPath: (path: string, entryIndex: number) => void;
  onHoverPath: (path: string | null, entryIndex: number) => void;
  onActivatePath: (path: string, entry: EvidenceIndexEntry) => void;
  onCycleEntry: (path: string) => void;
  inline?: boolean;
}) {
  const indexed = entries.length > 0;
  const entry = indexed ? (entries[activeEntryIndex] ?? entries[0]) : null;
  const canSeek =
    entry &&
    entry.status !== "unresolved" &&
    typeof entry.start_ms === "number";
  const displayValue = formatPrimitiveValue(value);

  if (!indexed) {
    return inline ? (
      <span className="text-sm leading-6 text-foreground/75">{displayValue}</span>
    ) : (
      <p className="text-sm leading-6 text-foreground">{displayValue}</p>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0",
        inline ? "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1" : "grid gap-1.5",
      )}
    >
      <button
        type="button"
        className={cn(
          "text-left text-sm leading-6 transition-colors",
          inline
            ? cn(
              "text-foreground/75 underline decoration-dotted underline-offset-2",
              (isActive || isHovered) && "text-foreground decoration-primary/50",
            )
            : cn(
              "rounded-md border px-2 py-1",
              isActive || isHovered
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/70 bg-background text-foreground hover:bg-muted/50",
            ),
        )}
        aria-current={isActive ? "true" : undefined}
        aria-pressed={isActive}
        onFocus={() => onFocusPath(path, activeEntryIndex)}
        onBlur={() => onHoverPath(null, 0)}
        onMouseEnter={() => onHoverPath(path, activeEntryIndex)}
        onMouseLeave={() => onHoverPath(null, 0)}
        onClick={() => {
          if (entry) {
            onActivatePath(path, entry);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (entry) {
              onActivatePath(path, entry);
            }
          }
        }}
      >
        {displayValue}
      </button>
      {entry ? (
        <EntryAffordance
          entry={entry}
          entryCount={entries.length}
          entryIndex={activeEntryIndex}
        />
      ) : null}
      {entries.length > 1 ? (
        <button
          type="button"
          className="text-xs text-primary underline underline-offset-2"
          onClick={() => onCycleEntry(path)}
        >
          Next candidate
        </button>
      ) : null}
      {canSeek ? (
        <span className="sr-only">Activating seeks audio to evidence start</span>
      ) : null}
    </div>
  );
}

type IndexedArtifactNodeProps = {
  path: string;
  value: unknown;
  depth?: number;
  lookup: Map<string, EvidenceIndexEntry[]>;
  activePath: string | null;
  hoverPath: string | null;
  entryIndexByPath: Record<string, number>;
  glossaryLabels?: Record<string, string>;
  captureId?: string;
  extractedValues?: ExtractedValueStub[];
  onExtractedValueSaved?: () => void;
  onFocusPath: (path: string, entryIndex: number) => void;
  onHoverPath: (path: string | null, entryIndex: number) => void;
  onActivatePath: (path: string, entry: EvidenceIndexEntry) => void;
  onCycleEntry: (path: string) => void;
  animateEntrance?: boolean;
};

const ROOT_EXTRACTION_SCROLL_MAX_HEIGHT = "max-h-72";

function IndexedReadableArtifactValue({
  path,
  value,
  depth,
  lookup,
  activePath,
  hoverPath,
  entryIndexByPath,
  glossaryLabels,
  captureId,
  extractedValues,
  onExtractedValueSaved,
  onFocusPath,
  onHoverPath,
  onActivatePath,
  onCycleEntry,
  animateEntrance = false,
}: IndexedArtifactNodeProps) {
  const currentDepth = depth ?? 0;

  if (isPrimitiveArtifactValue(value)) {
    const entries = getEntriesForPath(lookup, path);
    const pathEntryIndex = entryIndexByPath[path] ?? 0;

    return (
      <IndexedPrimitiveValue
        path={path}
        value={value}
        entries={entries}
        isActive={activePath === path}
        isHovered={hoverPath === path}
        activeEntryIndex={pathEntryIndex}
        onFocusPath={onFocusPath}
        onHoverPath={onHoverPath}
        onActivatePath={onActivatePath}
        onCycleEntry={onCycleEntry}
      />
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0 || value.every(isEmptyArtifactValue)) {
      return null;
    }

    return (
      <div className={cn(SURFACE_CLASS, "grid gap-1.5")}>
        {value.map((item, index) => {
          if (isEmptyArtifactValue(item)) {
            return null;
          }

          const itemPath = pointerForIndex(path, index);

          return (
            <div
              key={`${currentDepth}-${index}`}
              className={cn(
                "gap-1.5",
                isStructuredArtifactValue(item)
                  ? "grid"
                  : "flex flex-wrap items-start gap-x-3 gap-y-1",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium capitalize text-foreground/75">
                  Item {index + 1}
                </span>
                <ExtractedEntityEditAction
                  itemPath={itemPath}
                  captureId={captureId}
                  extractedValues={extractedValues}
                  glossaryLabels={glossaryLabels}
                  onExtractedValueSaved={onExtractedValueSaved}
                />
              </div>
              <div className="min-w-0 flex-1">
                <IndexedReadableArtifactValue
                  path={itemPath}
                  value={item}
                  depth={currentDepth + 1}
                  lookup={lookup}
                  activePath={activePath}
                  hoverPath={hoverPath}
                  entryIndexByPath={entryIndexByPath}
                  glossaryLabels={glossaryLabels}
                  captureId={captureId}
                  extractedValues={extractedValues}
                  onExtractedValueSaved={onExtractedValueSaved}
                  onFocusPath={onFocusPath}
                  onHoverPath={onHoverPath}
                  onActivatePath={onActivatePath}
                  onCycleEntry={onCycleEntry}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, entryValue]) => !isEmptyArtifactValue(entryValue),
    );

    if (entries.length === 0) {
      return null;
    }

    if (shouldRenderCompactArtifactObject(entries)) {
      const compactRows = entries.map(([key, entryValue]) => {
        const childPath = pointerForProperty(path, key);
        const childEntries = getEntriesForPath(lookup, childPath);
        const pathEntryIndex = entryIndexByPath[childPath] ?? 0;

        return (
          <div
            key={`${currentDepth}-${key}`}
            className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"
          >
            {currentDepth > 0 ? (
              <CornerDownRight className="h-4 w-4 text-foreground/50" />
            ) : null}
            <span className="text-sm font-medium capitalize text-foreground">
              {formatArtifactKey(key, glossaryLabels)}
            </span>
            {isPrimitiveArtifactValue(entryValue) ? (
              <IndexedPrimitiveValue
                path={childPath}
                value={entryValue}
                entries={childEntries}
                isActive={activePath === childPath}
                isHovered={hoverPath === childPath}
                activeEntryIndex={pathEntryIndex}
                onFocusPath={onFocusPath}
                onHoverPath={onHoverPath}
                onActivatePath={onActivatePath}
                onCycleEntry={onCycleEntry}
                inline
              />
            ) : (
              <div className="min-w-0 flex-1">
                <IndexedReadableArtifactValue
                  path={childPath}
                  value={entryValue}
                  depth={currentDepth + 1}
                  lookup={lookup}
                  activePath={activePath}
                  hoverPath={hoverPath}
                  entryIndexByPath={entryIndexByPath}
                  glossaryLabels={glossaryLabels}
                  captureId={captureId}
                  extractedValues={extractedValues}
                  onExtractedValueSaved={onExtractedValueSaved}
                  onFocusPath={onFocusPath}
                  onHoverPath={onHoverPath}
                  onActivatePath={onActivatePath}
                  onCycleEntry={onCycleEntry}
                />
              </div>
            )}
          </div>
        );
      });

      if (animateEntrance && currentDepth === 0) {
        return (
          <IndexedResultStagger className="flex flex-col items-start gap-x-3 gap-y-1.5">
            {compactRows.map((row) => (
              <IndexedResultStaggerItem key={row.key}>{row}</IndexedResultStaggerItem>
            ))}
          </IndexedResultStagger>
        );
      }

      return (
        <div className="flex flex-col items-start gap-x-3 gap-y-1.5">
          {compactRows}
        </div>
      );
    }

    const entryCards = entries.map(([key, entryValue]) => {
      const childPath = pointerForProperty(path, key);
      const extractionContent = (
        <IndexedReadableArtifactValue
          path={childPath}
          value={entryValue}
          depth={currentDepth + 1}
          lookup={lookup}
          activePath={activePath}
          hoverPath={hoverPath}
          entryIndexByPath={entryIndexByPath}
          glossaryLabels={glossaryLabels}
          captureId={captureId}
          extractedValues={extractedValues}
          onExtractedValueSaved={onExtractedValueSaved}
          onFocusPath={onFocusPath}
          onHoverPath={onHoverPath}
          onActivatePath={onActivatePath}
          onCycleEntry={onCycleEntry}
        />
      );

      return (
        <div
          key={`${currentDepth}-${key}`}
          className={cn(
            "grid gap-1.5",
            currentDepth > 0
              ? "border-l-2 border-border px-3"
              : cn(SURFACE_CLASS, "rounded-xl p-3"),
          )}
        >
          <span className="text-xs font-medium uppercase text-foreground">
            {formatArtifactKey(key, glossaryLabels)}
          </span>
          <div className="min-w-0">
            {currentDepth === 0 ? (
              <ScrollArea className={ROOT_EXTRACTION_SCROLL_MAX_HEIGHT}>
                <div className="pr-3">{extractionContent}</div>
              </ScrollArea>
            ) : (
              extractionContent
            )}
          </div>
        </div>
      );
    });

    if (animateEntrance && currentDepth === 0) {
      return (
        <IndexedResultStagger className="grid gap-3">
          {entryCards.map((card) => (
            <IndexedResultStaggerItem key={card.key}>{card}</IndexedResultStaggerItem>
          ))}
        </IndexedResultStagger>
      );
    }

    return <div className="grid gap-3">{entryCards}</div>;
  }

  return <ReadableArtifactValue value={value} depth={currentDepth} />;
}

export function IndexedExtractionTree({
  extraction,
  indexEntries,
  activePath,
  hoverPath,
  activeEntryIndex,
  entryIndexByPath,
  glossaryLabels,
  captureId,
  extractedValues,
  onExtractedValueSaved,
  onFocusPath,
  onHoverPath,
  onActivatePath,
  onCycleEntry,
  animateEntrance = false,
}: {
  extraction: Record<string, unknown>;
  indexEntries: EvidenceIndexEntry[];
  activePath: string | null;
  hoverPath: string | null;
  activeEntryIndex: number;
  entryIndexByPath: Record<string, number>;
  glossaryLabels?: Record<string, string>;
  captureId?: string;
  extractedValues?: ExtractedValueStub[];
  onExtractedValueSaved?: () => void;
  onFocusPath: (path: string, entryIndex: number) => void;
  onHoverPath: (path: string | null, entryIndex: number) => void;
  onActivatePath: (path: string, entry: EvidenceIndexEntry) => void;
  onCycleEntry: (path: string) => void;
  animateEntrance?: boolean;
}) {
  const lookup = useMemo(
    () => buildIndexLookup(indexEntries),
    [indexEntries],
  );

  return (
    <IndexedReadableArtifactValue
      path=""
      value={extraction}
      lookup={lookup}
      activePath={activePath}
      hoverPath={hoverPath}
      entryIndexByPath={entryIndexByPath}
      glossaryLabels={glossaryLabels}
      captureId={captureId}
      extractedValues={extractedValues}
      onExtractedValueSaved={onExtractedValueSaved}
      onFocusPath={onFocusPath}
      onHoverPath={onHoverPath}
      onActivatePath={onActivatePath}
      onCycleEntry={onCycleEntry}
      animateEntrance={animateEntrance}
    />
  );
}
