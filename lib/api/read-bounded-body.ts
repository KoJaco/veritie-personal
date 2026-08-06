import { NextResponse } from "next/server";

export class BoundedBodyError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "BoundedBodyError";
        this.status = status;
    }
}

function parseContentLength(request: Request): number | null {
    const headers = request.headers;
    if (!headers || typeof headers.get !== "function") {
        return null;
    }

    const header = headers.get("content-length");
    if (!header) {
        return null;
    }

    const parsed = Number.parseInt(header, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
}

/**
 * Reads request body text with a byte limit. Rejects oversized content-length
 * before reading; aborts after maxBytes+1 when streaming.
 */
export async function readBoundedText(
    request: Request,
    maxBytes: number,
): Promise<string> {
    const contentLength = parseContentLength(request);
    if (contentLength !== null && contentLength > maxBytes) {
        throw new BoundedBodyError("Request body too large", 413);
    }

    const reader = request.body?.getReader();
    if (!reader) {
        const text = await request.text();
        const byteLength = Buffer.byteLength(text, "utf8");
        if (byteLength > maxBytes) {
            throw new BoundedBodyError("Request body too large", 413);
        }
        return text;
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        if (!value) {
            continue;
        }

        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
            throw new BoundedBodyError("Request body too large", 413);
        }

        chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return new TextDecoder("utf-8", { fatal: false }).decode(combined);
}

export async function readBoundedJson(
    request: Request,
    maxBytes: number,
): Promise<unknown> {
    const text = await readBoundedText(request, maxBytes);

    if (text.length === 0) {
        throw new BoundedBodyError("Invalid JSON body", 400);
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new BoundedBodyError("Invalid JSON body", 400);
    }
}

export function boundedBodyErrorResponse(error: BoundedBodyError): NextResponse {
    return NextResponse.json({ error: error.message }, { status: error.status });
}
