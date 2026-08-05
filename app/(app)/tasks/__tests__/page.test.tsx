import { render, screen, within } from "@testing-library/react";
import TasksPage from "@/app/(app)/tasks/page";
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

jest.mock("@/components/lens/LensDialogControl", () => ({
    UrlLensDialogControl: () => <button type="button">Lens</button>,
}));

jest.mock("@/app/(app)/tasks/_components/TaskFilterToolbar", () => ({
    TaskFilterToolbar: () => <button type="button">Filters</button>,
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

    it("renders the setup task summary, filter feedback, and list rows", async () => {
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

        const summary = screen.getByLabelText("Task summary");
        expect(summary).toBeInTheDocument();
        expect(within(summary).getByText("Open setup tasks")).toBeInTheDocument();
        expect(within(summary).getByText("Blocked setup tasks")).toBeInTheDocument();

        expect(
            screen.getByText("Assign setup owners across your baseline checks"),
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Validate access provisioning approvals"),
        ).not.toBeInTheDocument();
        expect(
            screen.getAllByRole("link").some((link) =>
                link.getAttribute("href")?.startsWith("/tasks/fresh-"),
            ),
        ).toBe(true);
    });

    it("renders applied filters and the filtered empty state when the URL narrows the queue", async () => {
        render(
            await TasksPage({
                searchParams: Promise.resolve({
                    aspect: "all",
                    status: ["blocked", "open"],
                    owner: ["user_current"],
                    check: ["fresh-task-assign-owners-check"],
                    resource: ["resource_seed_1"],
                }),
            }),
        );

        const appliedFilters = screen.getByLabelText("Applied filters");
        expect(within(appliedFilters).getByText("0 tasks")).toBeInTheDocument();
        expect(
            screen.getByText("No tasks match these filters"),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /clear filters/i })).toBeInTheDocument();
    });

    it("offers an inline create task action when a scoped lens hides setup tasks", async () => {
        render(
            await TasksPage({
                searchParams: Promise.resolve({
                    aspect: "work",
                }),
            }),
        );

        expect(screen.getByText("No setup tasks yet")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /ask assistant/i }),
        ).toBeInTheDocument();
    });

    it("uses onboarding summary to prioritize setup tasks", async () => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: true,
            summary: {
                enabledAspects: ["work", "finance"],
                capturePreference: "voice_first",
                aiMode: "strict",
            },
        });

        render(
            await TasksPage({
                searchParams: Promise.resolve({
                    aspect: "all",
                }),
            }),
        );

        expect(
            screen.getByText("Start the attachment and operating proof plan"),
        ).toBeInTheDocument();
    });
});
