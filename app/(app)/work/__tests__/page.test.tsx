import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(app)/work/page";
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
        actions,
    }: {
        title: string;
        actions?: React.ReactNode;
    }) => (
        <div data-testid="page-header">
            <h1>{title}</h1>
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

jest.mock("@/components/lens/LensDialogControl", () => ({
    UrlLensDialogControl: () => <button type="button">Lens</button>,
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

describe("DashboardPage", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
    });

    it("renders the setup-first dashboard", async () => {
        render(
            await DashboardPage({
                searchParams: Promise.resolve({
                    scope: "all",
                }),
            }),
        );

        expect(screen.getByText("Work")).toBeInTheDocument();
        expect(screen.getByText("First actions")).toBeInTheDocument();
        expect(screen.getByText("Setup blockers")).toBeInTheDocument();
        expect(screen.getByText("Setup overview")).toBeInTheDocument();
        expect(screen.getByText("Setup areas")).toBeInTheDocument();
        expect(screen.queryByText("Activity Signals")).not.toBeInTheDocument();
        expect(screen.queryByText("Active Workstreams")).not.toBeInTheDocument();
    });

    it("uses onboarding summary to shape setup blockers when present", async () => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: true,
            summary: {
                companySize: "11_50",
                industry: "saas",
                dataSensitivity: "high",
                aiMode: "guided",
            },
        });

        render(
            await DashboardPage({
                searchParams: Promise.resolve({
                    scope: "all",
                }),
            }),
        );

        expect(
            screen.getByText("Define high-sensitivity data handling guardrails"),
        ).toBeInTheDocument();
    });
});
