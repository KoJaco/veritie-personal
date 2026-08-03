import { fireEvent, render, screen } from "@testing-library/react";
import { ConnectionsCatalogClient } from "@/app/(app)/work/connections/_components/ConnectionsCatalogClient";

const mockUseIsMobileViewport = jest.fn(() => false);
const toastSuccess = jest.fn();

jest.mock("next/link", () => {
    return function MockLink({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        );
    };
});

jest.mock("sonner", () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
    },
}));

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: () => mockUseIsMobileViewport(),
}));

jest.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dialog-shell">{children}</div>
    ),
    DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-shell">{children}</div>
    ),
    DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const props = {
    connected: [
        {
            id: "conn_azure",
            key: "azure_ad",
            label: "Azure Active Directory",
            status: "connected" as const,
            healthStatus: "healthy" as const,
            lastSyncedAt: "2026-03-26T00:00:00.000Z",
            coverageSummary:
                "Keeps identity attachments fresh for reviewer attestations and MFA posture checks.",
            group: "connected" as const,
            detailHref: "/work/connections/conn_azure",
            actionLabel: "Open" as const,
        },
    ],
    disconnected: [
        {
            id: "conn_jira",
            key: "jira",
            label: "Jira",
            status: "disconnected" as const,
            healthStatus: "inactive" as const,
            coverageSummary:
                "Turns delivery workflows and approvals into attachments for change-management checks.",
            group: "disconnected" as const,
            actionLabel: "Connect" as const,
        },
    ],
    providerOptions: [
        {
            key: "jira",
            label: "Jira",
            authType: "api_key" as const,
            coverageSummary:
                "Turns delivery workflows and approvals into attachments for change-management checks.",
            attachmentTypes: ["change tickets"],
            recommendedScopes: ["Projects"],
        },
    ],
};

describe("ConnectionsCatalogClient", () => {
    beforeEach(() => {
        mockUseIsMobileViewport.mockReturnValue(false);
        toastSuccess.mockReset();
    });

    it("keeps the index lean and uses links for inspectable connections", () => {
        render(<ConnectionsCatalogClient {...props} />);

        expect(screen.getByText("Connections overview")).toBeInTheDocument();
        expect(screen.getAllByText("Connected").length).toBeGreaterThan(0);
        expect(screen.getByText("Disconnected")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Open/i })).toHaveAttribute(
            "href",
            "/work/connections/conn_azure",
        );
        expect(
            screen.queryByText("Needs attention"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Generated attachments")).not.toBeInTheDocument();
    });

    it("uses dialog shell on desktop and progresses through connect flow", () => {
        render(<ConnectionsCatalogClient {...props} />);

        fireEvent.click(screen.getByRole("button", { name: /Connect/i }));
        expect(screen.getByText("Connect provider")).toBeInTheDocument();
        expect(screen.getByText("Authenticate")).toBeInTheDocument();
        expect(screen.getAllByText("Jira").length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
        fireEvent.click(screen.getByRole("button", { name: /Review success/i }));
        fireEvent.click(screen.getByRole("button", { name: /Finish/i }));

        expect(screen.getAllByTestId("dialog-shell").length).toBeGreaterThan(0);
        expect(toastSuccess).toHaveBeenCalled();
    });

    it("uses drawer shell on mobile for action flows", () => {
        mockUseIsMobileViewport.mockReturnValue(true);

        render(<ConnectionsCatalogClient {...props} />);

        fireEvent.click(screen.getByRole("button", { name: /Connect/i }));

        expect(screen.getAllByTestId("drawer-shell").length).toBeGreaterThan(0);
    });
});
