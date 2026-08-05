import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/(app)/settings/page";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { DataSourceAdapters } from "@/lib/data-source";

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

jest.mock("@/components/route", () => ({
    PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock("@/components/context/ContextPayloadSlot", () => ({
    ContextPayloadSlot: () => null,
}));

jest.mock("@/lib/data-source", () => ({
    getDataSourceAdapters: jest.fn(),
}));

jest.mock("@/lib/data-source/registry", () => ({
    getDataSourceKind: jest.fn(() => "backend"),
}));

const mockedGetDataSourceAdapters = jest.mocked(getDataSourceAdapters);

function createAdapterMock(
    settings: Awaited<ReturnType<DataSourceAdapters["settings"]["getSettings"]>>,
): DataSourceAdapters {
    return {
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
            getConnectionsIndex: jest.fn(),
            getConnectionDetail: jest.fn(),
        },
        settings: {
            getSettings: async () => settings,
        },
        timeline: {
            getTimelineIndex: jest.fn(),
            getTimelineEventDetail: jest.fn(),
        },
        captures: {
            getCapturesIndex: jest.fn(),
            getCaptureDetail: jest.fn(),
        },
    };
}

const ownerSettings = {
    profile: {
        name: "Jordan Smith",
        email: "jordan@company.com",
        role: "Owner",
        lastLoginAt: "2026-03-12T00:00:00.000Z",
        workspaceName: "Jordan Workspace",
    },
    team: [],
    capabilities: [],
    scopeMapping: {
        mappingStatus: "valid" as const,
        topValidationErrors: [],
    },
    frameworkConfiguration: {
        soc2: {
            mappingStatus: "valid" as const,
            topValidationErrors: [],
        },
    },
};

describe("SettingsPage", () => {
    beforeEach(() => {
        mockedGetDataSourceAdapters.mockReturnValue(
            createAdapterMock(ownerSettings),
        );
    });

    it("renders account profile, sign out, and owner delete controls", async () => {
        render(await SettingsPage({ searchParams: Promise.resolve({}) }));

        expect(screen.getByText("Settings")).toBeInTheDocument();
        expect(screen.getByText("Account details")).toBeInTheDocument();
        expect(screen.getByLabelText("Display name")).toBeInTheDocument();
        expect(screen.getByLabelText("Workspace name")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Sign out" })).toHaveAttribute(
            "href",
            "/auth/logout",
        );
        expect(
            screen.getAllByRole("button", { name: "Delete account" }).length,
        ).toBeGreaterThan(0);
        expect(screen.queryByText("Workspace admin")).not.toBeInTheDocument();
        expect(screen.queryByText("Scope mapping")).not.toBeInTheDocument();
        expect(screen.queryByText("Capability preview")).not.toBeInTheDocument();
    });
});
