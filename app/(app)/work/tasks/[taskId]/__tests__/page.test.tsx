import { render, screen } from "@testing-library/react";
import TaskPage from "@/app/(app)/work/tasks/[taskId]/page";
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

jest.mock("@/components/context/ContextPayloadSlot", () => ({
    ContextPayloadSlot: () => null,
}));

jest.mock("@/components/attachments/AttachmentUploadFlow", () => ({
    AttachmentUploadFlow: ({ triggerLabel = "upload attachment" }) => (
        <button type="button">{triggerLabel}</button>
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

const mockedGetStubServerBootstrap = jest.mocked(getStubServerBootstrap);

describe("TaskPage", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
    });

    it("renders setup task detail sections and attachment upload affordance", async () => {
        render(
            await TaskPage({
                params: Promise.resolve({
                    taskId: "fresh-task-assign-owners",
                }),
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(screen.getByText("Task overview")).toBeInTheDocument();
        expect(screen.getByText("Attachments")).toBeInTheDocument();
        expect(screen.getByText("Documents")).toBeInTheDocument();
        expect(screen.getByText("Activity")).toBeInTheDocument();
        expect(screen.getByText("Your setup work, prioritised")).toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: /upload attachment/i }).length,
        ).toBeGreaterThan(0);
    });

    it("renders the setup attachments empty state when no attachments are linked", async () => {
        render(
            await TaskPage({
                params: Promise.resolve({ taskId: "fresh-task-create-policies" }),
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(
            screen.getByText(
                "This setup task does not require attachments yet. Capture the baseline workflow first, then attach supporting material as the workspace matures.",
            ),
        ).toBeInTheDocument();
    });
});
