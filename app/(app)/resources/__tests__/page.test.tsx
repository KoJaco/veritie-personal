import { render, screen } from "@testing-library/react";
import ResourcesPage from "@/app/(app)/resources/page";
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

jest.mock("@/components/context/ContextPayloadSlot", () => ({
    ContextPayloadSlot: () => null,
}));

jest.mock("@/components/route", () => {
    const actual = jest.requireActual("@/components/route");

    return {
        ...actual,
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
    };
});

jest.mock("@/components/lens/LensDialogControl", () => ({
    UrlLensDialogControl: () => <button type="button">Lens</button>,
}));

jest.mock("@/components/resources/ResourceCreateFlow", () => ({
    ResourceCreateFlow: () => <button type="button">Add resource</button>,
}));

jest.mock("@/app/(app)/resources/_components/ResourcesFilters", () => ({
    ResourcesFilters: () => <div>Resources Filters</div>,
}));

jest.mock("@/lib/data-source", () => ({
    ...jest.requireActual("@/lib/data-source"),
    getDataSourceAdapters: jest.fn(),
}));

jest.mock("@/lib/onboarding-stub/server", () => ({
    getStubServerBootstrap: jest.fn(),
}));

const mockedGetDataSourceAdapters = jest.mocked(getDataSourceAdapters);
const mockedGetStubServerBootstrap = jest.mocked(getStubServerBootstrap);

function createAdapterMock(): DataSourceAdapters {
    const actual = jest.requireActual("@/lib/data-source/stub-adapter") as {
        stubDataSourceAdapters: DataSourceAdapters;
    };

    return actual.stubDataSourceAdapters;
}

describe("ResourcesPage", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
        mockedGetDataSourceAdapters.mockReturnValue(createAdapterMock());
    });

    it("renders summary cards, filters, and the bootstrap empty state", async () => {
        render(
            await ResourcesPage({
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(screen.getByText("Resources")).toBeInTheDocument();
        expect(screen.getByText("Tracked resources")).toBeInTheDocument();
        expect(screen.getByText("Resources Filters")).toBeInTheDocument();
        expect(
            screen.getByText(/No resources added yet/i),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: /add resource/i }).length,
        ).toBeGreaterThan(0);
    });
});
