import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/(app)/settings/page";
import { getDataSourceAdapters } from "@/lib/data-source";
import type { DataSourceAdapters } from "@/lib/data-source";
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

jest.mock("@/lib/onboarding-stub/server", () => ({
    getStubServerBootstrap: jest.fn(),
}));

const mockedGetDataSourceAdapters = jest.mocked(getDataSourceAdapters);
const mockedGetStubServerBootstrap = jest.mocked(getStubServerBootstrap);

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

describe("SettingsPage scope configuration", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
    });

    it("renders invalid mapping state with top validation errors and remediation links", async () => {
        mockedGetDataSourceAdapters.mockReturnValue(
            createAdapterMock({
                profile: {
                    name: "Jordan Smith",
                    email: "you@company.com",
                    role: "Admin",
                    lastLoginAt: "2026-03-12T00:00:00.000Z",
                },
                team: [],
                capabilities: [],
                scopeMapping: {
                    mappingStatus: "invalid",
                    topValidationErrors: [
                        {
                            id: "error_1",
                            title: "Missing check owner mapping",
                            detail: "3 checks are unmapped.",
                            remediation: {
                                label: "Review blocked readiness tasks",
                                href: "/tasks?scope=operations-readiness&focus=blocked",
                            },
                        },
                    ],
                },
                frameworkConfiguration: {
                    soc2: {
                        mappingStatus: "invalid",
                        topValidationErrors: [],
                    },
                },
            }),
        );

        render(await SettingsPage({ searchParams: Promise.resolve({}) }));

        expect(screen.getByText("Jordan Smith")).toBeInTheDocument();
        expect(screen.getByText("Capability preview")).toBeInTheDocument();
        expect(screen.getByText("Team")).toBeInTheDocument();
        expect(screen.getByText("Scope mapping: invalid")).toBeInTheDocument();
        expect(screen.getByText("Top validation errors")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Review blocked readiness tasks" }),
        ).toHaveAttribute(
            "href",
            "/tasks?scope=operations-readiness&focus=blocked",
        );
    });

    it("renders valid mapping state with no blocking validation errors", async () => {
        mockedGetDataSourceAdapters.mockReturnValue(
            createAdapterMock({
                profile: {
                    name: "Jordan Smith",
                    email: "you@company.com",
                    role: "Admin",
                    lastLoginAt: "2026-03-12T00:00:00.000Z",
                },
                team: [],
                capabilities: [],
                scopeMapping: {
                    mappingStatus: "valid",
                    topValidationErrors: [],
                },
                frameworkConfiguration: {
                    soc2: {
                        mappingStatus: "valid",
                        topValidationErrors: [],
                    },
                },
            }),
        );

        render(await SettingsPage({ searchParams: Promise.resolve({}) }));

        expect(screen.getByText("Workspace admin")).toBeInTheDocument();
        expect(screen.getByText("Scope mapping: valid")).toBeInTheDocument();
        expect(
            screen.getByText(
                "No blocking validation errors are currently detected.",
            ),
        ).toBeInTheDocument();
    });

    it("renders the fresh-mode placeholder instead of full settings content", async () => {
        mockedGetDataSourceAdapters.mockReturnValue(
            createAdapterMock({
                profile: {
                    name: "Jordan Smith",
                    email: "you@company.com",
                    role: "Admin",
                    lastLoginAt: "2026-03-12T00:00:00.000Z",
                },
                team: [],
                capabilities: [],
                scopeMapping: {
                    mappingStatus: "valid",
                    topValidationErrors: [],
                },
                frameworkConfiguration: {
                    soc2: {
                        mappingStatus: "valid",
                        topValidationErrors: [],
                    },
                },
            }),
        );
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: true,
            summary: {
                enabledAspects: ["work", "personal"],
                capturePreference: "voice_first",
                aiMode: "guided",
            },
        });

        render(await SettingsPage({ searchParams: Promise.resolve({}) }));

        expect(screen.getByText("Workspace admin")).toBeInTheDocument();
        expect(screen.getByText("Scope mapping: valid")).toBeInTheDocument();
    });
});
