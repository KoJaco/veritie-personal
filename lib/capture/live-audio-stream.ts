import type { LiveJobSession } from "@veritie/sdk";
import { captureFlowLog } from "@/lib/capture/capture-flow-logger";
import { concatUint8Arrays, sha256Hex } from "@/lib/capture/sha256";

/** ~5 min of compressed webm at typical voice bitrates. */
export const MAX_LIVE_STREAM_BYTES = 8 * 1024 * 1024;

export type LiveChunkStreamState = {
    sequence: number;
    offsetBytes: number;
    chunks: Uint8Array[];
};

export function createLiveChunkStreamState(): LiveChunkStreamState {
    return {
        sequence: 0,
        offsetBytes: 0,
        chunks: [],
    };
}

export async function sendLiveAudioChunk(
    session: LiveJobSession,
    state: LiveChunkStreamState,
    data: Blob,
): Promise<LiveChunkStreamState> {
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.byteLength === 0) {
        captureFlowLog.debug("chunk.skip_empty", { sequence: state.sequence });
        return state;
    }

    if (state.offsetBytes + bytes.byteLength > MAX_LIVE_STREAM_BYTES) {
        throw new Error("Recording exceeded the maximum live stream size.");
    }

    captureFlowLog.debug("chunk.send", {
        sequence: state.sequence,
        bytes: bytes.byteLength,
        offsetBytes: state.offsetBytes,
    });

    const chunkSha256 = await sha256Hex(bytes);
    await session.sendChunk(
        {
            sequence: state.sequence,
            offset_bytes: state.offsetBytes,
            size_bytes: bytes.byteLength,
            chunk_sha256: chunkSha256,
        },
        bytes,
    );

    return {
        sequence: state.sequence + 1,
        offsetBytes: state.offsetBytes + bytes.byteLength,
        chunks: [...state.chunks, bytes],
    };
}

export async function endLiveAudioStream(
    session: LiveJobSession,
    state: LiveChunkStreamState,
): Promise<void> {
    if (state.sequence === 0) {
        captureFlowLog.error("stream.end.no_chunks", {
            sessionId: session.sessionId,
            jobId: session.jobId,
            offsetBytes: state.offsetBytes,
            chunkBufferCount: state.chunks.length,
        });
        throw new Error("No audio was captured.");
    }

    const fullBuffer = concatUint8Arrays(state.chunks);
    const finalChecksum = await sha256Hex(fullBuffer);

    captureFlowLog.info("stream.end", {
        sessionId: session.sessionId,
        jobId: session.jobId,
        chunks: state.sequence,
        totalBytes: state.offsetBytes,
    });

    await session.end({
        last_sequence: state.sequence - 1,
        total_bytes: state.offsetBytes,
        final_checksum_sha256: finalChecksum,
    });
}
