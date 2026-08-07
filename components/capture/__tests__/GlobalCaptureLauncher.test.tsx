import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPrepareLease = jest.fn();
const mockReleaseLease = jest.fn();

jest.mock("framer-motion", () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
        button: ({
            children,
            onClick,
            ...props
        }: React.ComponentProps<"button">) => (
            <button type="button" onClick={onClick} {...props}>
                {children}
            </button>
        ),
        div: ({
            children,
            onClick,
            ...props
        }: React.ComponentProps<"div">) => (
            <div onClick={onClick} {...props}>
                {children}
            </div>
        ),
    },
    useReducedMotion: () => true,
}));

jest.mock("@/lib/hooks/usePersistedCaptureLauncherTucked", () => ({
    usePersistedCaptureLauncherTucked: () => ({
        isTucked: false,
        setIsTucked: jest.fn(),
        isHydrated: true,
    }),
}));

jest.mock("@/lib/hooks/useEscapeClose", () => ({
    useEscapeClose: jest.fn(),
    useInitialFocus: jest.fn(),
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: jest.fn(() => false),
}));

jest.mock("@/components/ui/mobile-overlay-visibility", () => ({
    useMobileOverlayOpen: jest.fn(() => false),
}));

jest.mock("@/lib/capture/capture-audio-client", () => ({
    getCapturePreferences: jest.fn(async () => ({
        saveVoiceLogAudio: false,
        captureLocationLabel: "Office",
    })),
}));

jest.mock("@/components/capture/VoiceCaptureLauncherPanel", () => ({
    VoiceCaptureLauncherPanel: ({
        onBack,
    }: {
        onBack: () => void;
    }) => (
        <div>
            <button type="button" onClick={onBack}>Voice panel back</button>
        </div>
    ),
}));

jest.mock("@/components/capture/VeritieCaptureLeaseContext", () => {
    const actual = jest.requireActual<
        typeof import("@/components/capture/VeritieCaptureLeaseContext")
    >("@/components/capture/VeritieCaptureLeaseContext");

    return {
        ...actual,
        VeritieCaptureLeaseProvider: ({
            children,
        }: {
            children: React.ReactNode;
        }) => children,
        useVeritieCaptureLease: () => ({
            veritie: {},
            captureHandle: { snapshot: { jobId: "job_launcher" } },
            leasePhase: "ready",
            leaseError: null,
            pipelineConfig: null,
            extractionConfig: {},
            prepareLease: mockPrepareLease,
            getOrPrepareLease: mockPrepareLease,
            renewLease: jest.fn(),
            releaseLease: mockReleaseLease,
        }),
    };
});

import { GlobalCaptureLauncher } from "@/components/capture/GlobalCaptureLauncher";
import { useMobileOverlayOpen } from "@/components/ui/mobile-overlay-visibility";
import { useIsMobileViewport } from "@/lib/hooks/useIsMobileViewport";

const mockUseMobileOverlayOpen = useMobileOverlayOpen as jest.Mock;
const mockUseIsMobileViewport = useIsMobileViewport as jest.Mock;

describe("GlobalCaptureLauncher", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseIsMobileViewport.mockReturnValue(false);
        mockUseMobileOverlayOpen.mockReturnValue(false);
        mockPrepareLease.mockResolvedValue({
            snapshot: { jobId: "job_launcher" },
        });
    });

    it("prepares lease when the launcher FAB opens", async () => {
        render(<GlobalCaptureLauncher />);

        fireEvent.click(
            screen.getByRole("button", { name: /open capture launcher/i }),
        );

        await waitFor(() => {
            expect(mockPrepareLease).toHaveBeenCalledTimes(1);
        });
        expect(mockPrepareLease.mock.calls[0][0]).toMatchObject({
            location_label: "Office",
        });
    });

    it("does not release lease when returning to options from voice", async () => {
        render(<GlobalCaptureLauncher />);

        fireEvent.click(
            screen.getByRole("button", { name: /open capture launcher/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: /voice log/i }));

        await waitFor(() => {
            expect(screen.getByText("Voice panel back")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /voice panel back/i }));

        expect(mockReleaseLease).not.toHaveBeenCalled();
    });

    it("releases lease when the launcher closes", async () => {
        render(<GlobalCaptureLauncher />);

        fireEvent.click(
            screen.getByRole("button", { name: /open capture launcher/i }),
        );
        const closeButtons = screen.getAllByRole("button", {
            name: /close capture launcher/i,
        });
        fireEvent.click(closeButtons[closeButtons.length - 1]);

        await waitFor(() => {
            expect(mockReleaseLease).toHaveBeenCalledTimes(1);
        });
    });

    it("hides the launcher chrome while a mobile overlay is open", () => {
        mockUseIsMobileViewport.mockReturnValue(true);
        mockUseMobileOverlayOpen.mockReturnValue(true);

        const { container } = render(<GlobalCaptureLauncher />);

        const hiddenLauncher = container.querySelector('[aria-hidden="true"]');
        expect(hiddenLauncher).toBeInTheDocument();
        expect(hiddenLauncher).toHaveClass("opacity-0", "pointer-events-none");
    });
});
