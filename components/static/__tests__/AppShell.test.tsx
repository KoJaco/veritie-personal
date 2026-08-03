import { render, screen, waitFor } from "@testing-library/react";
import { AppShell } from "@/components/static/AppShell";

const mockUseContextRail = jest.fn();
const mockUseRailContract = jest.fn();
const mockUseIsMobileViewport = jest.fn();

jest.mock("@/components/context/ContextRailProvider", () => ({
    ContextRailProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
    useContextRail: () => mockUseContextRail(),
}));

jest.mock("@/components/context/client-route-resolver", () => ({
    useRailContract: () => mockUseRailContract(),
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: () => mockUseIsMobileViewport(),
}));

jest.mock("@/components/static/AppSidebar", () => ({
    AppSidebar: () => <div data-testid="app-sidebar" />,
}));

jest.mock("@/components/static/AppHeader", () => ({
    AppHeader: () => <div data-testid="app-header" />,
}));

jest.mock("@/components/context/ContextRail", () => ({
    ContextRail: () => <div data-testid="context-rail" />,
}));

describe("AppShell", () => {
    beforeEach(() => {
        mockUseContextRail.mockReset();
        mockUseRailContract.mockReset();
        mockUseIsMobileViewport.mockReset();

        mockUseContextRail.mockReturnValue({
            state: "CLOSED",
            isHydrated: true,
            toggle: jest.fn(),
            close: jest.fn(),
        });

        mockUseRailContract.mockReturnValue({
            routeId: "dashboard",
            contractVersion: 1,
            enabled: true,
            showTrigger: true,
            defaultTab: "assistant",
            tabs: [{ key: "assistant", label: "Assistant" }],
            context: undefined,
        });

        mockUseIsMobileViewport.mockReturnValue(false);
    });

    it("renders floating trigger when rail is closed and route allows trigger", () => {
        render(<AppShell>content</AppShell>);

        expect(
            screen.getByRole("button", { name: "Toggle AI assistant" }),
        ).toBeInTheDocument();
    });

    it("hides floating trigger and renders overlay rail when OPEN_OVERLAY", () => {
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            isHydrated: true,
            toggle: jest.fn(),
            close: jest.fn(),
        });

        render(<AppShell>content</AppShell>);

        expect(
            screen.queryByRole("button", { name: "Toggle AI assistant" }),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("context-rail")).toBeInTheDocument();
    });

    it("renders pinned rail container on desktop when PINNED_DOCKED and hydrated", () => {
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            isHydrated: true,
            toggle: jest.fn(),
            close: jest.fn(),
        });

        const { container } = render(<AppShell>content</AppShell>);

        expect(screen.getByTestId("context-rail")).toBeInTheDocument();
        expect(container.innerHTML).toContain("lg:pr-96");
    });

    it("force-closes rail when route is disabled and state is open", async () => {
        const close = jest.fn();
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            isHydrated: true,
            toggle: jest.fn(),
            close,
        });
        mockUseRailContract.mockReturnValue({
            routeId: "settings",
            contractVersion: 1,
            enabled: false,
            showTrigger: false,
            defaultTab: "assistant",
            tabs: [],
            context: undefined,
        });

        render(<AppShell>content</AppShell>);

        await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    });

    it("does not apply pinned-right layout padding when mobile viewport is true", () => {
        mockUseContextRail.mockReturnValue({
            state: "PINNED_DOCKED",
            isHydrated: true,
            toggle: jest.fn(),
            close: jest.fn(),
        });
        mockUseIsMobileViewport.mockReturnValue(true);

        const { container } = render(<AppShell>content</AppShell>);

        expect(container.innerHTML).not.toContain("lg:pr-96");
    });
});
