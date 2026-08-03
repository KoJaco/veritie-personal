import { render, screen } from "@testing-library/react";
import ConnectionDetailPage from "@/app/(app)/work/connections/[connectionId]/page";
import { getDataSourceAdapters } from "@/lib/data-source";

const mockNotFound = jest.fn();

jest.mock("next/navigation", () => ({
    notFound: () => mockNotFound(),
}));

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

jest.mock("@/lib/hooks/useIsMobileViewport", () => ({
    useIsMobileViewport: () => false,
}));

jest.mock("@/components/static/PageFrame", () => ({
    PageFrame: ({
        header,
        children,
    }: {
        header?: React.ReactNode;
        children: React.ReactNode;
    }) => (
        <div>
            {header}
            {children}
        </div>
    ),
}));

jest.mock("@/components/context/ContextPayloadSlot", () => ({
    ContextPayloadSlot: () => null,
}));

jest.mock("@/components/route", () => ({
    PageHeader: ({
        title,
        actions,
    }: {
        title: string;
        actions?: React.ReactNode;
    }) => (
        <div>
            <h1>{title}</h1>
            {actions}
        </div>
    ),
}));

jest.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
        asChild ? children : <div>{children}</div>,
    DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/data-source", () => ({
    getDataSourceAdapters: jest.fn(),
}));

const mockedGetDataSourceAdapters = jest.mocked(getDataSourceAdapters);

describe("ConnectionDetailPage", () => {
    beforeEach(() => {
        mockNotFound.mockReset();
        mockedGetDataSourceAdapters.mockReturnValue({
            dashboard: {
                getTasks: jest.fn(),
                getWorkDashboard: jest.fn(),
                getTaskSummaries: jest.fn(),
            },
            tasks: {
                getTasksIndex: jest.fn(),
                getTaskDetail: jest.fn(),
            },
            attachments: {
                getAttachmentsIndex: jest.fn(),
                getAttachmentDetail: jest.fn(),
                uploadAttachmentVersion: jest.fn(),
            },
            objects: {
                getObjectsIndex: jest.fn(),
                getObjectDetail: jest.fn(),
            },
            resources: {
                getResourcesIndex: jest.fn(),
                getResourceDetail: jest.fn(),
                createResource: jest.fn(),
            },
            checks: {
                getAggregatedChecks: jest.fn(),
                getChecksForScope: jest.fn(),
                getCheckDetail: jest.fn(),
            },
            connections: {
                getConnectionsIndex: () => ({
                    connected: [],
                    disconnected: [],
                    providerOptions: [
                        {
                            key: "azure_ad",
                            label: "Azure Active Directory",
                            authType: "oauth",
                            coverageSummary: "Coverage",
                            attachmentTypes: ["user inventory"],
                            recommendedScopes: ["Directory users"],
                        },
                    ],
                }),
                getConnectionDetail: (id: string) => {
                    if (id === "missing") {
                        throw new Error("missing");
                    }

                    return {
                        id,
                        key: "azure_ad",
                        label: "Azure Active Directory",
                        status: "connected",
                        healthStatus: "warning",
                        authType: "oauth",
                        lastSyncedAt: "2026-03-27T10:15:00.000Z",
                        connectedAt: "2026-01-12T09:00:00.000Z",
                        externalAccountLabel: "Workspace Identity Directory",
                        connectedByName: "Jordan Smith",
                        coverageSummary:
                            "Keeps identity attachments fresh for reviewer attestations and MFA posture checks.",
                        automatedChecks: 18,
                        manualChecksRemaining: 5,
                        failingResourceCount: 2,
                        lastError: "Repository audit log sync is delayed.",
                        capabilities: ["users", "groups"],
                        recommendedScopes: ["Directory users"],
                        attachmentTypes: ["user inventory"],
                        impactSummary:
                            "This connection currently automates 18 checks and leaves 5 checks dependent on manual attachment refresh.",
                        generatedAttachments: [
                            {
                                id: "ev_1",
                                title: "Azure Active Directory user inventory",
                                status: "active",
                                href: "/work/documents/att_detail",
                            },
                        ],
                        actionAvailability: {
                            canSyncNow: true,
                            canReconnect: true,
                            canDisconnect: true,
                        },
                    };
                },
            },
            settings: {
                getSettings: jest.fn(),
            },
        });
    });

    it("renders detail sections and header actions", async () => {
        render(
            await ConnectionDetailPage({
                params: Promise.resolve({ connectionId: "conn_azure_ad" }),
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(screen.getByText("Azure Active Directory")).toBeInTheDocument();
        expect(screen.getByText("Overview")).toBeInTheDocument();
        expect(screen.getByText("Sync status")).toBeInTheDocument();
        expect(screen.getByText("Coverage and scopes")).toBeInTheDocument();
        expect(screen.getAllByText("Generated attachments").length).toBeGreaterThan(0);
        expect(screen.getByText("Settings / danger zone")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sync now/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Reconnect/i })).toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: /Disconnect/i }).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText(/Kick off a demo-only sync run/i)).toBeInTheDocument();
        expect(screen.getByText(/Disconnecting remains a demo-only action/i)).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /View/i }),
        ).toHaveAttribute("href", "/work/documents/att_detail");
    });

    it("fails closed for missing connection details", async () => {
        await ConnectionDetailPage({
            params: Promise.resolve({ connectionId: "missing" }),
            searchParams: Promise.resolve({ scope: "all" }),
        });

        expect(mockNotFound).toHaveBeenCalled();
    });
});
