/** Escape a single JSON Pointer token per RFC 6901. */
export function escapePointerToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Join path segments into an RFC 6901 pointer. */
export function joinPointerPath(...segments: string[]): string {
  if (segments.length === 0) {
    return "";
  }
  return `/${segments.map(escapePointerToken).join("/")}`;
}

export function pointerForProperty(parentPath: string, key: string): string {
  if (!parentPath) {
    return joinPointerPath(key);
  }
  return `${parentPath}/${escapePointerToken(key)}`;
}

export function pointerForIndex(parentPath: string, index: number): string {
  if (!parentPath) {
    return joinPointerPath(String(index));
  }
  return `${parentPath}/${escapePointerToken(String(index))}`;
}

export function isScalarValue(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
