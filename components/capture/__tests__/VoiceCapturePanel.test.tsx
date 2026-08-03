import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockCreateAndUploadJob = jest.fn<() => Promise<{ job: { job_id: string } }>>();
const mockGetJob = jest.fn<() => Promise<unknown>>();
const mockToastError = jest.fn();
const mockPersistCaptureFn = jest.fn<
    () => Promise<{ captureId: string; timelineEventCount: number }>
>();

jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: (...args: unknown[]) => mockToastError(...args),
    },
}));

jest.mock("@/components/capture/LiveAudioWaveform", () => ({
    LiveAudioWaveform: () => <div data-testid="waveform" />,
}));

import { VoiceCapturePanel } from "@/components/capture/VoiceCapturePanel";

const veritieMock = {
    createAndUploadJob: mockCreateAndUploadJob,
    getJob: mockGetJob,
};

const completedJob = {
    job_id: "job_voice_test",
    status: "completed",
    transcript: { text: "Test transcript" },
};

class MockMediaRecorder {
    static isTypeSupported = jest.fn(() => true);
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
    }> = {},
) {
    return render(
        <VoiceCapturePanel
            veritie={veritieMock as never}
            onBack={overrides.onBack ?? jest.fn()}
            onComplete={overrides.onComplete ?? jest.fn()}
            persistCaptureFn={overrides.persistCaptureFn ?? mockPersistCaptureFn}
        />,
    );
}

describe("VoiceCapturePanel", () => {
    const trackStop = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAndUploadJob.mockResolvedValue({ job: { job_id: "job_voice_test" } });
        mockGetJob.mockResolvedValue(completedJob);
        mockPersistCaptureFn.mockResolvedValue({
            captureId: "capture_test",
            timelineEventCount: 0,
        });

        Object.defineProperty(global.navigator, "mediaDevices", {
            configurable: true,
            value: {
                getUserMedia: jest.fn(async () => ({
                    getTracks: () => [{ stop: trackStop }],
                })),
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

    it("shows transcript ready after a successful save", async () => {
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByText("Transcript ready")).toBeInTheDocument();
        });

        expect(mockPersistCaptureFn).toHaveBeenCalledWith("job_voice_test");
    });

    it("surfaces save failure separately from capture failure", async () => {
        mockPersistCaptureFn.mockRejectedValue(new Error("Failed to persist capture"));

        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByText(/transcript ready but not saved/i)).toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: /retry save/i })).toBeInTheDocument();
    });

    it("aborts in-flight work when cancel is clicked during processing", async () => {
        let resolveUpload: ((value: { job: { job_id: string } }) => void) | undefined;
        mockCreateAndUploadJob.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUpload = resolve;
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

        resolveUpload?.({ job: { job_id: "job_voice_test" } });
        await waitFor(() => {
            expect(screen.queryByText("Transcript ready")).not.toBeInTheDocument();
        });
    });
});
