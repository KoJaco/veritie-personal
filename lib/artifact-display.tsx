import type { ReactNode } from "react";

export type PrimitiveArtifactValue = string | number | boolean | null;

export function isPrimitiveArtifactValue(
    value: unknown,
): value is PrimitiveArtifactValue {
    return (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    );
}

export function isEmptyArtifactValue(value: unknown): boolean {
    if (value === null || value === undefined || value === "") {
        return true;
    }

    if (Array.isArray(value)) {
        return value.length === 0 || value.every(isEmptyArtifactValue);
    }

    if (typeof value === "object") {
        return Object.values(value as Record<string, unknown>).every(
            isEmptyArtifactValue,
        );
    }

    return false;
}

export function isStructuredArtifactValue(value: unknown): boolean {
    return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function formatArtifactKey(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatPrimitiveValue(value: PrimitiveArtifactValue): string {
    if (value === null) {
        return "—";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    return String(value);
}

export function shouldRenderCompactArtifactObject(
    entries: [string, unknown][],
): boolean {
    return entries.every(([, entryValue]) => isPrimitiveArtifactValue(entryValue));
}

export function ReadableArtifactValue({
    value,
    depth = 0,
}: {
    value: unknown;
    depth?: number;
}): ReactNode {
    if (isPrimitiveArtifactValue(value)) {
        return (
            <p className="text-sm leading-6 text-foreground">
                {formatPrimitiveValue(value)}
            </p>
        );
    }

    if (Array.isArray(value)) {
        return (
            <ul className="grid gap-1 text-sm">
                {value.map((item, index) => (
                    <li key={`${depth}-${index}`}>
                        <ReadableArtifactValue value={item} depth={depth + 1} />
                    </li>
                ))}
            </ul>
        );
    }

    if (typeof value === "object" && value !== null) {
        return (
            <div className="grid gap-2">
                {Object.entries(value as Record<string, unknown>).map(
                    ([key, entryValue]) => (
                        <div key={`${depth}-${key}`} className="grid gap-1">
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                                {formatArtifactKey(key)}
                            </span>
                            <ReadableArtifactValue
                                value={entryValue}
                                depth={depth + 1}
                            />
                        </div>
                    ),
                )}
            </div>
        );
    }

    return null;
}
