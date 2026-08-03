import { render, screen } from "@testing-library/react";
import ConnectionsPage from "@/app/(app)/work/connections/page";
import { getDataSourceAdapters } from "@/lib/data-source";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";

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
    PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
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

jest.mock("@/lib/onboarding-stub/server", () => ({
    getStubServerBootstrap: jest.fn(),
}));

const mockedGetDataSourceAdapters = jest.mocked(getDataSourceAdapters);
const mockedGetStubServerBootstrap = jest.mocked(getStubServerBootstrap);

describe("ConnectionsPage", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
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
                    connected: [
                        {
                            id: "conn_azure",
                            key: "azure_ad",
                            label: "Azure Active Directory",
                            status: "connected",
                            healthStatus: "healthy",
                            lastSyncedAt: "2026-03-26T00:00:00.000Z",
                            coverageSummary:
                                "Keeps identity attachments fresh for reviewer attestations and MFA posture checks.",
                            group: "connected",
                            detailHref: "/work/connections/conn_azure",
                            actionLabel: "Open",
                        },
                    ],
                    disconnected: [
                        {
                            id: "conn_jira",
                            key: "jira",
                            label: "Jira",
                            status: "disconnected",
                            healthStatus: "inactive",
                            coverageSummary:
                                "Turns delivery workflows and approvals into attachments for change-management checks.",
                            group: "disconnected",
                            actionLabel: "Connect",
                        },
                    ],
                    providerOptions: [
                        {
                            key: "jira",
                            label: "Jira",
                            authType: "api_key",
                            coverageSummary:
                                "Turns delivery workflows and approvals into attachments for change-management checks.",
                            attachmentTypes: ["change tickets"],
                            recommendedScopes: ["Projects"],
                        },
                    ],
                }),
                getConnectionDetail: jest.fn(),
            },
            settings: {
                getSettings: jest.fn(),
            },
        });
    });

    it("renders only disconnected providers during bootstrap setup", async () => {
        render(
            await ConnectionsPage({
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(screen.getByText("Connections")).toBeInTheDocument();
        expect(screen.getByText("Disconnected")).toBeInTheDocument();
        expect(screen.queryByText("Azure Active Directory")).not.toBeInTheDocument();
        expect(screen.getAllByText("Jira").length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /Connect/i })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /Open/i })).not.toBeInTheDocument();
    });
});
