import {
    createLiveChunkStreamState,
    flushBufferedLiveChunks,
    sendLiveAudioChunk,
} from "@/lib/capture/live-audio-stream";

jest.mock("@/lib/capture/sha256", () => ({
    sha256Hex: jest.fn(async () => "abc123"),
    concatUint8Arrays: jest.fn((chunks: Uint8Array[]) => {
        const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return merged;
    }),
}));

class TestBlob {
    size: number;

    constructor(private readonly bytes: Uint8Array) {
        this.size = bytes.byteLength;
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        return this.bytes.buffer.slice(
            this.bytes.byteOffset,
            this.bytes.byteOffset + this.bytes.byteLength,
        ) as ArrayBuffer;
    }
}

function makeBlob(bytes: number[]) {
    return new TestBlob(new Uint8Array(bytes)) as unknown as Blob;
}

const sendChunkMock = jest.fn(async () => undefined);

const sessionMock = {
    sessionId: "session_test",
    jobId: "job_test",
    sendChunk: sendChunkMock,
};

describe("live-audio-stream", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("flushBufferedLiveChunks preserves sequence and offset order", async () => {
        const initialState = createLiveChunkStreamState();
        const chunks = [makeBlob([1, 2]), makeBlob([3, 4, 5])];

        const finalState = await flushBufferedLiveChunks(
            sessionMock as never,
            initialState,
            chunks,
        );

        expect(finalState.sequence).toBe(2);
        expect(finalState.offsetBytes).toBe(5);
        expect(sendChunkMock).toHaveBeenCalledTimes(2);
        expect(sendChunkMock).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                sequence: 0,
                offset_bytes: 0,
                size_bytes: 2,
            }),
            expect.any(Uint8Array),
        );
        expect(sendChunkMock).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                sequence: 1,
                offset_bytes: 2,
                size_bytes: 3,
            }),
            expect.any(Uint8Array),
        );
    });

    it("sendLiveAudioChunk advances state for a single chunk", async () => {
        const initialState = createLiveChunkStreamState();
        const nextState = await sendLiveAudioChunk(
            sessionMock as never,
            initialState,
            makeBlob([9]),
        );

        expect(nextState.sequence).toBe(1);
        expect(nextState.offsetBytes).toBe(1);
    });
});
