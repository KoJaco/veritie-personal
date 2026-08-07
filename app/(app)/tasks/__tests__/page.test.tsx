import { render, screen } from "@testing-library/react";
import TasksPage from "@/app/(app)/tasks/page";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";

jest.mock("@/components/route", () => ({
    PageHeader: ({
        title,
        description,
        actions,
    }: {
        title: string;
        description?: string;
        actions?: React.ReactNode;
    }) => (
        <div data-testid="page-header">
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
            <div data-testid="page-header-actions">{actions}</div>
        </div>
    ),
    EmptyState: ({
        title,
        description,
    }: {
        title: string;
        description?: string;
    }) => (
        <div data-testid="empty-state">
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
        </div>
    ),
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

jest.mock("@/app/(app)/tasks/_components/TasksPageHeaderActions", () => ({
    TasksPageHeaderActions: () => (
        <button type="button">Ask assistant</button>
    ),
}));

jest.mock("@/lib/logging/server-logger", () => ({
    logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock("@/lib/onboarding-stub/server", () => ({
    getStubServerBootstrap: jest.fn(),
}));

jest.mock("@/lib/data-source/registry", () => ({
    getDataSourceKind: () => "stub",
}));

const mockedGetStubServerBootstrap = jest.mocked(getStubServerBootstrap);

describe("TasksPage", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
    });

    it("renders the page header and placeholder empty state", async () => {
        render(
            await TasksPage({
                searchParams: Promise.resolve({
                    aspect: "all",
                }),
            }),
        );

        expect(screen.getByText("Tasks")).toBeInTheDocument();
        expect(
            screen.getByText("Your setup work, prioritised"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("empty-state")).toBeInTheDocument();
        expect(screen.getByText("Tasks coming soon")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Your prioritised work queue, filters, and setup tasks will appear here.",
            ),
        ).toBeInTheDocument();
    });

    it("keeps header actions available while the list UI is placeholder-only", async () => {
        render(
            await TasksPage({
                searchParams: Promise.resolve({
                    aspect: "all",
                }),
            }),
        );

        expect(
            screen.getByRole("button", { name: /ask assistant/i }),
        ).toBeInTheDocument();
    });
});
