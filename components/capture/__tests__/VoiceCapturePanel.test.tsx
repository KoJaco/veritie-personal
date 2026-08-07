import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockStartCapture = jest.fn();
const mockRefresh = jest.fn();
const mockGetJob = jest.fn();
const mockToastError = jest.fn();
const mockPersistCaptureFn = jest.fn();
const mockHandleClose = jest.fn();
const mockRenewLease = jest.fn();
const mockPrepareLease = jest.fn();
const mockEnqueueBackgroundPipeline = jest.fn();

jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: (...args: unknown[]) => mockToastError(...args),
    },
}));

jest.mock("@/components/capture/LiveAudioWaveform", () => ({
    LiveAudioWaveform: () => <div data-testid="waveform" />,
}));

jest.mock("@/lib/capture/live-audio-stream", () => ({
    createLiveChunkStreamState: jest.fn(() => ({
        sequence: 0,
        offsetBytes: 0,
        chunks: [],
    })),
    sendLiveAudioChunk: jest.fn(async (_session, state: { sequence: number }) => ({
        sequence: state.sequence + 1,
        offsetBytes: 5,
        chunks: [new Uint8Array([1, 2, 3, 4, 5])],
    })),
    flushBufferedLiveChunks: jest.fn(
        async (
            _session,
            state: { sequence: number; offsetBytes: number; chunks: Uint8Array[] },
            chunks: Blob[],
        ) => ({
            sequence: state.sequence + chunks.length,
            offsetBytes: state.offsetBytes + chunks.length * 5,
            chunks: state.chunks,
        }),
    ),
    endLiveAudioStream: jest.fn(async () => undefined),
    MAX_LIVE_STREAM_BYTES: 8 * 1024 * 1024,
}));

jest.mock("@/lib/capture/capture-background-pipeline", () => ({
    enqueueCaptureBackgroundPipeline: (...args: unknown[]) =>
        mockEnqueueBackgroundPipeline(...args),
}));

jest.mock("@/lib/hooks/useScreenWakeLock", () => ({
    useScreenWakeLock: jest.fn(),
}));

import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";

import { endLiveAudioStream, flushBufferedLiveChunks } from "@/lib/capture/live-audio-stream";
import { VoiceCapturePanel } from "@/components/capture/VoiceCapturePanel";

const liveSessionMock = {
    closed: false,
    close: jest.fn(),
    sendChunk: jest.fn(),
    end: jest.fn(),
};

const captureHandleMock = {
    snapshot: { jobId: "job_voice_test" },
    startCapture: mockStartCapture,
    refresh: mockRefresh,
    close: mockHandleClose,
};

const veritieMock = {
    getJob: mockGetJob,
};

const transcriptReadyJob = {
    job_id: "job_voice_test",
    status: "running",
    transcript_ready: true,
    transcript: { text: "Test transcript" },
    extraction_state: "running",
    background_processing: true,
};

class MockMediaRecorder {
    static isTypeSupported = jest.fn((mimeType: string) =>
        mimeType === "audio/webm" || mimeType === "audio/webm;codecs=opus",
    );
    state = "recording";
    mimeType = "audio/webm";
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onerror: (() => void) | null = null;
    private stopListener: (() => void) | null = null;

    constructor(_stream: MediaStream, _options?: { mimeType?: string }) {}

    start() {
        this.state = "recording";
        queueMicrotask(() => {
            this.ondataavailable?.({
                data: new Blob(["audio"], { type: "audio/webm" }),
            });
        });
    }

    stop() {
        this.state = "inactive";
        queueMicrotask(() => {
            this.stopListener?.();
        });
    }

    addEventListener(type: string, listener: () => void, options?: { once?: boolean }) {
        if (type === "stop") {
            this.stopListener = listener;
            if (options?.once) {
                const original = listener;
                this.stopListener = () => {
                    original();
                    this.stopListener = null;
                };
            }
        }
    }
}

function renderPanel(
    overrides: Partial<{
        onBack: () => void;
        onComplete: () => void;
        persistCaptureFn: typeof mockPersistCaptureFn;
        leasePhase: "idle" | "preparing" | "ready" | "error";
        captureHandle: typeof captureHandleMock | null;
        prepareLease: typeof mockPrepareLease;
        captureLocationLabel?: string;
    }> = {},
) {
    return render(
        <VoiceCapturePanel
            veritie={veritieMock as never}
            captureHandle={
                (overrides.captureHandle === undefined
                    ? captureHandleMock
                    : overrides.captureHandle) as never
            }
            leasePhase={overrides.leasePhase ?? "ready"}
            prepareLease={overrides.prepareLease ?? mockPrepareLease}
            renewLease={mockRenewLease}
            onBack={overrides.onBack ?? jest.fn()}
            onComplete={overrides.onComplete ?? jest.fn()}
            persistCaptureFn={overrides.persistCaptureFn ?? mockPersistCaptureFn}
            captureLocationLabel={overrides.captureLocationLabel}
        />,
    );
}

describe("VoiceCapturePanel", () => {
    const trackStop = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrepareLease.mockResolvedValue(captureHandleMock);
        mockRenewLease.mockImplementation(() => undefined);
        mockStartCapture.mockImplementation(async (options?: { signal?: AbortSignal }) => {
            if (options?.signal?.aborted) {
                throw new DOMException("Aborted", "AbortError");
            }
            return liveSessionMock;
        });
        mockRefresh.mockResolvedValue(transcriptReadyJob);
        mockGetJob.mockResolvedValue(transcriptReadyJob);
        mockPersistCaptureFn.mockResolvedValue({
            captureId: "capture_test",
            timelineEventCount: 0,
        });

        Object.defineProperty(global.navigator, "mediaDevices", {
            configurable: true,
            value: {
                getUserMedia: jest.fn(async () => {
                    const track = { stop: trackStop, readyState: "live" };
                    return {
                        getTracks: () => [track],
                        getAudioTracks: () => [track],
                    };
                }),
            },
        });

        Object.defineProperty(global, "MediaRecorder", {
            configurable: true,
            writable: true,
            value: MockMediaRecorder,
        });
    });

    it("stops media tracks on unmount", async () => {
        const { unmount } = renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        unmount();
        expect(trackStop).toHaveBeenCalled();
    });

    it("shows transcript ready without waiting for enrichment", async () => {
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByText("Transcript ready")).toBeInTheDocument();
        });

        expect(mockGetJob).not.toHaveBeenCalled();
        expect(mockEnqueueBackgroundPipeline).toHaveBeenCalledWith(
            expect.objectContaining({ jobId: "job_voice_test" }),
        );
    });

    it("shows Done before background persist resolves", async () => {
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
        });

        expect(mockPersistCaptureFn).not.toHaveBeenCalled();
    });

    it("keeps the live session open through stream finalization", async () => {
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        const startSignal = mockStartCapture.mock.calls[0]?.[0]?.signal as
            | AbortSignal
            | undefined;
        expect(startSignal?.aborted).toBe(false);

        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(endLiveAudioStream).toHaveBeenCalled();
        });

        expect(startSignal?.aborted).toBe(false);
        expect(liveSessionMock.close).not.toHaveBeenCalled();
    });

    it("treats stream finalization failure as capture failure", async () => {
        jest.mocked(endLiveAudioStream).mockRejectedValueOnce(
            new Error("No audio was captured."),
        );

        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByText(/voice log unavailable/i)).toBeInTheDocument();
        });

        expect(mockEnqueueBackgroundPipeline).not.toHaveBeenCalled();
        expect(mockRenewLease).toHaveBeenCalled();
    });

    it("enqueues background pipeline even after unmount", async () => {
        const { unmount } = renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(mockEnqueueBackgroundPipeline).toHaveBeenCalled();
        });

        unmount();
        expect(mockEnqueueBackgroundPipeline).toHaveBeenCalledTimes(1);
    });

    it("does not prepare lease when starting recording", async () => {
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));

        await waitFor(() => {
            expect(mockStartCapture).toHaveBeenCalled();
        });

        expect(mockPrepareLease).not.toHaveBeenCalled();
    });

    it("disables start while lease preparation is in flight", () => {
        renderPanel({ leasePhase: "preparing", captureHandle: null });

        expect(
            screen.queryByRole("button", { name: /start recording/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/preparing veritie lease/i)).toBeInTheDocument();
    });

    it("aborts in-flight work when cancel is clicked during processing", async () => {
        let resolveRefresh: ((value: typeof transcriptReadyJob) => void) | undefined;
        mockRefresh.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRefresh = resolve;
                }),
        );

        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
        });

        resolveRefresh?.(transcriptReadyJob);
        await waitFor(() => {
            expect(screen.queryByText("Transcript ready")).not.toBeInTheDocument();
        });
        expect(mockEnqueueBackgroundPipeline).not.toHaveBeenCalled();
    });

    it("keeps the screen awake during live capture", async () => {
        renderPanel();

        expect(useScreenWakeLock).toHaveBeenCalledWith(false);

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(useScreenWakeLock).toHaveBeenCalledWith(true);
        });

        fireEvent.click(screen.getByRole("button", { name: /stop/i }));
        await waitFor(() => {
            expect(screen.getByText("Transcript ready")).toBeInTheDocument();
        });

        expect(useScreenWakeLock).toHaveBeenLastCalledWith(false);
    });

    it("cleans up capture session when navigating back", async () => {
        const onBack = jest.fn();
        renderPanel({ onBack });

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /^capture$/i }));

        expect(onBack).toHaveBeenCalled();
        expect(liveSessionMock.close).toHaveBeenCalled();
        expect(trackStop).toHaveBeenCalled();
    });

    it("shows Stop immediately after Start before the live session resolves", async () => {
        let resolveSession:
            | ((value: typeof liveSessionMock) => void)
            | undefined;
        mockStartCapture.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSession = resolve;
                }),
        );

        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));

        expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        expect(resolveSession).toBeDefined();

        resolveSession?.(liveSessionMock);
        await waitFor(() => {
            expect(flushBufferedLiveChunks).toHaveBeenCalled();
        });
    });

    it("buffers recorder chunks until the live session is ready", async () => {
        let resolveSession:
            | ((value: typeof liveSessionMock) => void)
            | undefined;
        mockStartCapture.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSession = resolve;
                }),
        );

        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        });

        resolveSession?.(liveSessionMock);

        await waitFor(() => {
            expect(flushBufferedLiveChunks).toHaveBeenCalledWith(
                liveSessionMock,
                expect.objectContaining({ sequence: 0 }),
                expect.arrayContaining([
                    expect.objectContaining({ type: "audio/webm" }),
                ]),
            );
        });
    });
});
