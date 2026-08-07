import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import {
    MobileOverlayVisibilityProvider,
    useMobileOverlayOpen,
    useRegisterMobileOverlay,
} from "@/components/ui/mobile-overlay-visibility";

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: jest.fn(() => true),
}));

const mockUseIsMobileViewport = jest.mocked(
    jest.requireMock<typeof import("@/lib/hooks/useIsMobileViewport")>(
        "@/lib/hooks/useIsMobileViewport",
    ).useIsMobileViewport,
);

function OverlayHarness({ open }: { open: boolean }) {
    useRegisterMobileOverlay(open);
    const isOpen = useMobileOverlayOpen();
    return <div>{isOpen ? "overlay-open" : "overlay-closed"}</div>;
}

function renderWithProvider(ui: ReactNode) {
    return render(
        <MobileOverlayVisibilityProvider>{ui}</MobileOverlayVisibilityProvider>,
    );
}

describe("mobile overlay visibility", () => {
    beforeEach(() => {
        mockUseIsMobileViewport.mockReturnValue(true);
    });

    it("tracks open mobile overlays via registration", () => {
        const { rerender } = renderWithProvider(<OverlayHarness open={false} />);
        expect(screen.getByText("overlay-closed")).toBeInTheDocument();

        rerender(
            <MobileOverlayVisibilityProvider>
                <OverlayHarness open />
            </MobileOverlayVisibilityProvider>,
        );
        expect(screen.getByText("overlay-open")).toBeInTheDocument();

        rerender(
            <MobileOverlayVisibilityProvider>
                <OverlayHarness open={false} />
            </MobileOverlayVisibilityProvider>,
        );
        expect(screen.getByText("overlay-closed")).toBeInTheDocument();
    });

    it("ignores overlays when viewport is not mobile", () => {
        mockUseIsMobileViewport.mockReturnValue(false);

        renderWithProvider(<OverlayHarness open />);
        expect(screen.getByText("overlay-closed")).toBeInTheDocument();
    });
});
