import { fireEvent, render, screen } from "@testing-library/react";
import { ContextRail } from "@/components/context/ContextRail";

const mockUseContextRail = jest.fn();
const mockUseIsMobileViewport = jest.fn();
const mockUseRailContract = jest.fn();

jest.mock("@/components/context/ContextRailProvider", () => ({
    useContextRail: () => mockUseContextRail(),
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: () => mockUseIsMobileViewport(),
}));

jest.mock("@/components/context/client-route-resolver", () => ({
    useRailContract: () => mockUseRailContract(),
}));

jest.mock("@/components/context/tabs", () => ({
    TAB_COMPONENTS: {
        assistant: () => (
            <div
                data-testid="assistant-tab-content"
                data-preserve-bottom-scroll="true"
            >
                Assistant
            </div>
        ),
        context: () => <div data-testid="context-tab-content">Context</div>,
    },
}));

jest.mock("@/components/ui/sheet", () => ({
    Sheet: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="sheet">{children}</div>
    ),
    SheetContent: ({
        children,
        onEscapeKeyDown,
    }: {
        children: React.ReactNode;
        onEscapeKeyDown?: (e: { preventDefault: () => void }) => void;
    }) => (
        <div data-testid="sheet-content">
            <button
                onClick={() => onEscapeKeyDown?.({ preventDefault: jest.fn() })}
            >
                escape-sheet
            </button>
            {children}
        </div>
    ),
}));

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({
        children,
        onOpenChange,
    }: {
        children: React.ReactNode;
        onOpenChange?: (open: boolean) => void;
    }) => (
        <div data-testid="drawer">
            <button onClick={() => onOpenChange?.(false)}>close-drawer</button>
            {children}
        </div>
    ),
    DrawerContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-content">{children}</div>
    ),
    DrawerHeader: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerClose: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("ContextRail", () => {
    beforeEach(() => {
        mockUseContextRail.mockReset();
        mockUseIsMobileViewport.mockReset();
        mockUseRailContract.mockReset();

        mockUseContextRail.mockReturnValue({
            state: "CLOSED",
            close: jest.fn(),
            pin: jest.fn(),
            unpin: jest.fn(),
        });
        mockUseIsMobileViewport.mockReturnValue(false);
        mockUseRailContract.mockReturnValue({
            routeId: "work",
            contractVersion: 1,
            enabled: true,
            showTrigger: true,
            defaultTab: "assistant",
            tabs: [
                { key: "assistant", label: "Assistant" },
                { key: "context", label: "Context" },
            ],
            context: undefined,
        });
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    });

    it("returns null when desktop state is CLOSED", () => {
        const { container } = render(<ContextRail />);
        expect(container.firstChild).toBeNull();
    });

    it("renders desktop OPEN_OVERLAY controls with pin and close actions", () => {
        const pin = jest.fn();
        const close = jest.fn();
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            close,
            pin,
            unpin: jest.fn(),
        });

        render(<ContextRail />);

        fireEvent.click(screen.getByRole("button", { name: "Pin" }));
        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(pin).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);
    });

    it("locks body scroll for desktop OPEN_OVERLAY and restores on unmount", () => {
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            close: jest.fn(),
            pin: jest.fn(),
            unpin: jest.fn(),
        });

        const { unmount } = render(<ContextRail />);

        expect(document.body.style.overflow).toBe("hidden");

        unmount();
        expect(document.body.style.overflow).toBe("");
    });

    it("renders desktop PINNED_DOCKED controls with unpin and close actions", () => {
        const unpin = jest.fn();
        const close = jest.fn();
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            close,
            pin: jest.fn(),
            unpin,
        });

        render(<ContextRail />);

        fireEvent.click(screen.getByRole("button", { name: "Unpin" }));
        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(unpin).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);
    });

    it("does not lock body scroll for desktop PINNED_DOCKED", () => {
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            close: jest.fn(),
            pin: jest.fn(),
            unpin: jest.fn(),
        });

        render(<ContextRail />);
        expect(document.body.style.overflow).toBe("");
    });

    it("preserves bottom position when pinned rail transitions from scrolled to top layout", () => {
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            close: jest.fn(),
            pin: jest.fn(),
            unpin: jest.fn(),
        });

        const { rerender } = render(<ContextRail isScrolled={true} />);
        const scrollable = screen.getByTestId("assistant-tab-content");

        Object.defineProperty(scrollable, "scrollHeight", {
            configurable: true,
            value: 640,
        });
        scrollable.scrollTop = 120;

        rerender(<ContextRail isScrolled={false} />);

        expect(scrollable.scrollTop).toBe(640);
    });

    it("mobile path opens drawer only for OPEN_OVERLAY and closes via onOpenChange(false)", () => {
        const close = jest.fn();
        mockUseIsMobileViewport.mockReturnValue(true);
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            close,
            pin: jest.fn(),
            unpin: jest.fn(),
        });

        render(<ContextRail />);

        expect(screen.getByTestId("drawer")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "close-drawer" }));
        expect(close).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape key when rail is open", () => {
        const close = jest.fn();
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            close,
            pin: jest.fn(),
            unpin: jest.fn(),
        });

        render(<ContextRail />);
        fireEvent.keyDown(window, { key: "Escape" });

        expect(close).toHaveBeenCalledTimes(1);
    });

    it("clamps invalid defaultTab to first available tab", () => {
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            close: jest.fn(),
            pin: jest.fn(),
            unpin: jest.fn(),
        });
        mockUseRailContract.mockReturnValue({
            routeId: "work",
            contractVersion: 1,
            enabled: true,
            showTrigger: true,
            defaultTab: "assistant",
            tabs: [{ key: "context", label: "Context" }],
            context: undefined,
        });

        render(<ContextRail />);

        expect(screen.getByRole("tab", { name: "Context" })).toBeInTheDocument();
        expect(screen.queryByRole("tab", { name: "Assistant" })).not.toBeInTheDocument();
    });

    it("renders no tab triggers when route config has no tabs", () => {
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            close: jest.fn(),
            pin: jest.fn(),
            unpin: jest.fn(),
        });
        mockUseRailContract.mockReturnValue({
            routeId: "unknown",
            contractVersion: 1,
            enabled: false,
            showTrigger: false,
            defaultTab: "assistant",
            tabs: [],
            context: undefined,
        });

        render(<ContextRail />);

        expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    });
});
