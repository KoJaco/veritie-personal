import type { EvidenceIndexEntry } from "@veritie/sdk";

export function buildIndexLookup(
  entries: EvidenceIndexEntry[],
): Map<string, EvidenceIndexEntry[]> {
  const lookup = new Map<string, EvidenceIndexEntry[]>();

  for (const entry of entries) {
    const existing = lookup.get(entry.path);
    if (existing) {
      existing.push(entry);
    } else {
      lookup.set(entry.path, [entry]);
    }
  }

  return lookup;
}

export function getEntriesForPath(
  lookup: Map<string, EvidenceIndexEntry[]>,
  path: string,
): EvidenceIndexEntry[] {
  return lookup.get(path) ?? [];
}

export function hasIndexedPath(
  lookup: Map<string, EvidenceIndexEntry[]>,
  path: string,
): boolean {
  return lookup.has(path);
}
