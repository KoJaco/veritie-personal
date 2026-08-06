import type { ExtractedValueStub } from "@/lib/stubs/capture-stubs";

export function flattenExtractedValueAttributes(
    extractedValue: ExtractedValueStub,
): Record<string, unknown> {
    return {
        title: extractedValue.title,
        aspect: extractedValue.aspect,
        ...extractedValue.fields,
    };
}

export function parseEntityPointerPath(path: string): {
    listKey: string;
    index: number;
} | null {
    const segments = path.split("/").filter(Boolean);
    if (segments.length !== 2) {
        return null;
    }

    const index = Number(segments[1]);
    if (!Number.isInteger(index) || index < 0) {
        return null;
    }

    return {
        listKey: segments[0],
        index,
    };
}
