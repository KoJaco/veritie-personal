import React from "react";
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

jest.mock("next/dynamic", () => {
    return (importFn: () => Promise<{ GlobalCaptureLauncher: React.ComponentType }>) => {
        const { GlobalCaptureLauncher } = jest.requireActual<{
            GlobalCaptureLauncher: React.ComponentType;
        }>("@/components/capture/GlobalCaptureLauncher");
        return GlobalCaptureLauncher;
    };
});

jest.mock("@/components/capture/GlobalCaptureLauncher", () => ({
    GlobalCaptureLauncher: () => (
        <button type="button" aria-label="Open capture launcher">
            Capture
        </button>
    ),
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
            showTrigger: false,
            defaultTab: "assistant",
            tabs: [{ key: "assistant", label: "Assistant" }],
            context: undefined,
        });

        mockUseIsMobileViewport.mockReturnValue(false);
    });

    it("renders capture launcher instead of global assistant FAB", () => {
        render(<AppShell>content</AppShell>);

        expect(
            screen.getByRole("button", { name: "Open capture launcher" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Toggle AI assistant" }),
        ).not.toBeInTheDocument();
    });

    it("renders overlay rail when OPEN_OVERLAY", () => {
        mockUseContextRail.mockReturnValue({
            state: "OPEN_OVERLAY",
            isHydrated: true,
            toggle: jest.fn(),
            close: jest.fn(),
        });

        render(<AppShell>content</AppShell>);

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
