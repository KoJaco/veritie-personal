import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockCreateAndUploadJob = jest.fn<() => Promise<{ job: { job_id: string } }>>();
const mockGetJob = jest.fn<() => Promise<unknown>>();
const mockToastError = jest.fn();

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

describe("VoiceCapturePanel", () => {
    const trackStop = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAndUploadJob.mockResolvedValue({ job: { job_id: "job_voice_test" } });
        mockGetJob.mockResolvedValue(completedJob);

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

        global.fetch = jest.fn(async () => ({
            ok: true,
            json: async () => ({ captureId: "capture_test", timelineEventCount: 0 }),
        })) as unknown as typeof fetch;
    });

    it("stops media tracks on unmount", async () => {
        const { unmount } = render(
            <VoiceCapturePanel
                veritie={veritieMock as never}
                onBack={jest.fn()}
                onComplete={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        unmount();
        expect(trackStop).toHaveBeenCalled();
    });

    it("shows transcript ready after a successful save", async () => {
        render(
            <VoiceCapturePanel
                veritie={veritieMock as never}
                onBack={jest.fn()}
                onComplete={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /stop/i }));

        await waitFor(() => {
            expect(screen.getByText("Transcript ready")).toBeInTheDocument();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/captures",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ jobId: "job_voice_test" }),
            }),
        );
    });

    it("surfaces save failure separately from capture failure", async () => {
        global.fetch = jest.fn(async () => ({
            ok: false,
            json: async () => ({ error: "Failed to persist capture" }),
        })) as unknown as typeof fetch;

        render(
            <VoiceCapturePanel
                veritie={veritieMock as never}
                onBack={jest.fn()}
                onComplete={jest.fn()}
            />,
        );

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

        render(
            <VoiceCapturePanel
                veritie={veritieMock as never}
                onBack={jest.fn()}
                onComplete={jest.fn()}
            />,
        );

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
