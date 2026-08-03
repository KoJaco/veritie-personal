import { normalizeThrownError, VeritieSDKError } from "../errors";
import type {
    LiveChunkMetadata,
    LiveJobSession,
    LiveSessionEndRequest,
    OpenLiveSessionOptions,
    StreamIngestBootstrap,
    VeritieClientConfig,
    WebSocketFactory,
    WebSocketLike,
} from "../types";

class BrowserLiveJobSession implements LiveJobSession {
    private isClosed = false;
    private hasStarted = false;
    private closeCode: number | null = null;
    private closeReason: string | null = null;
    private closeWasClean: boolean | null = null;

    constructor(
        private readonly socket: WebSocketLike,
        readonly jobId: string,
        readonly bootstrap: StreamIngestBootstrap,
    ) {}

    get sessionId(): string {
        return this.bootstrap.session_id;
    }

    get started(): boolean {
        return this.hasStarted;
    }

    get closed(): boolean {
        return this.isClosed;
    }

    markClosed(event?: Pick<CloseEvent, "code" | "reason" | "wasClean">): void {
        this.isClosed = true;
        if (!event) {
            return;
        }
        this.closeCode = event.code;
        this.closeReason = event.reason;
        this.closeWasClean = event.wasClean;
    }

    private closedError(): VeritieSDKError {
        const details = {
            close_code: this.closeCode,
            close_reason: this.closeReason,
            close_was_clean: this.closeWasClean,
            ready_state: this.socket.readyState,
        };
        if (this.closeCode || this.closeReason) {
            return new VeritieSDKError({
                code: "live_session_closed",
                message: `Live session closed (code ${this.closeCode ?? "unknown"}${this.closeReason ? `: ${this.closeReason}` : ""})`,
                details,
            });
        }
        return new VeritieSDKError({
            code: "live_session_closed",
            message: "Live session is already closed",
            details,
        });
    }

    async sendChunk(
        metadata: LiveChunkMetadata,
        bytes: Blob | ArrayBuffer | Uint8Array,
    ): Promise<void> {
        if (this.isClosed) {
            throw this.closedError();
        }
        const binary = await toBinaryPayload(bytes);
        if (binary.byteLength !== metadata.size_bytes) {
            throw new VeritieSDKError({
                code: "live_chunk_size_mismatch",
                message: "Chunk byte length does not match metadata size_bytes",
            });
        }
        this.socket.send(
            JSON.stringify({
                type: "AUDIO_CHUNK",
                sequence: metadata.sequence,
                offset_bytes: metadata.offset_bytes,
                size_bytes: metadata.size_bytes,
                chunk_sha256: metadata.chunk_sha256,
            }),
        );
        this.socket.send(binary);
        this.hasStarted = true;
    }

    async end(request: LiveSessionEndRequest): Promise<void> {
        if (this.isClosed) {
            throw this.closedError();
        }
        this.socket.send(
            JSON.stringify({
                type: "STREAM_END",
                last_sequence: request.last_sequence,
                total_bytes: request.total_bytes,
                final_checksum_sha256: request.final_checksum_sha256,
            }),
        );
    }

    close(code?: number, reason?: string): void {
        if (this.isClosed) {
            return;
        }
        this.isClosed = true;
        this.socket.close(code, reason);
    }
}

export class LiveTransport {
    constructor(private readonly config: VeritieClientConfig) {}

    async open(
        jobId: string,
        bootstrap: StreamIngestBootstrap,
        options: OpenLiveSessionOptions = {},
    ): Promise<LiveJobSession> {
        let socket: WebSocketLike;
        try {
            socket = resolveWebSocketFactory(this.config)(
                bootstrap.websocket_url,
            );
        } catch (error) {
            throw normalizeThrownError(error, "live_open_failed");
        }
        socket.binaryType = "arraybuffer";

        const session = new BrowserLiveJobSession(socket, jobId, bootstrap);
        if (options.signal) {
            if (options.signal.aborted) {
                session.close();
                throw new VeritieSDKError({
                    code: "live_open_aborted",
                    message: "Live session open was aborted",
                });
            }
            options.signal.addEventListener(
                "abort",
                () => session.close(1000, "aborted"),
                { once: true },
            );
        }

        await waitForOpen(socket);
        socket.onclose = (event) => {
            session.markClosed(event);
        };
        socket.onerror = () => {
            session.markClosed();
        };
        socket.send(
            JSON.stringify({
                type: "STREAM_START",
                session_id: bootstrap.session_id,
                codec: bootstrap.codec,
                content_type: bootstrap.codec,
            }),
        );
        return session;
    }
}

function resolveWebSocketFactory(
    config: VeritieClientConfig,
): WebSocketFactory {
    if (config.webSocketFactory) {
        return config.webSocketFactory;
    }
    const ctor = globalThis.WebSocket;
    if (typeof ctor !== "function") {
        throw new VeritieSDKError({
            code: "live_websocket_unavailable",
            message: "This runtime does not provide a WebSocket implementation",
        });
    }
    return (url) => new ctor(url);
}

function waitForOpen(socket: WebSocketLike): Promise<void> {
    return new Promise((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.onerror = (event) => {
            reject(
                new VeritieSDKError({
                    code: "live_open_failed",
                    message: "Failed to open live transport websocket",
                    details: event,
                }),
            );
        };
        socket.onclose = (event) => {
            reject(
                new VeritieSDKError({
                    code: "live_open_failed",
                    message: `Live transport websocket closed before opening completed (code ${event.code}${event.reason ? `: ${event.reason}` : ""})`,
                    details: {
                        close_code: event.code,
                        close_reason: event.reason,
                        close_was_clean: event.wasClean,
                    },
                }),
            );
        };
    });
}

async function toBinaryPayload(
    bytes: Blob | ArrayBuffer | Uint8Array,
): Promise<ArrayBuffer | Uint8Array> {
    if (bytes instanceof Uint8Array) {
        return bytes;
    }
    if (bytes instanceof ArrayBuffer) {
        return bytes;
    }
    return bytes.arrayBuffer();
}

export async function digestSHA256Hex(
    data: Blob | ArrayBuffer | Uint8Array,
): Promise<string> {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        throw new VeritieSDKError({
            code: "sha256_unavailable",
            message:
                "This runtime does not provide crypto.subtle for SHA-256 digests",
        });
    }
    const payload = await toDigestBuffer(data);
    const hash = await subtle.digest("SHA-256", payload);
    return Array.from(new Uint8Array(hash))
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
}

async function toDigestBuffer(
    data: Blob | ArrayBuffer | Uint8Array,
): Promise<ArrayBuffer> {
    if (data instanceof Blob) {
        return data.arrayBuffer();
    }
    if (data instanceof ArrayBuffer) {
        return data;
    }
    const copy = new Uint8Array(data.byteLength)
    copy.set(data);
    return copy.buffer;
}

export function normalizeLiveTransportError(
    error: unknown,
    fallback = "live_transport_failed",
): VeritieSDKError {
    return normalizeThrownError(error, fallback);
}
