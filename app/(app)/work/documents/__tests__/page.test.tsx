import { render, screen } from "@testing-library/react";
import DocumentsPage from "@/app/(app)/work/documents/page";
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

jest.mock("@/app/(app)/work/documents/_components/DocumentsFilters", () => ({
    DocumentsFilters: () => <div>Documents Filters</div>,
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

describe("DocumentsPage", () => {
    beforeEach(() => {
        mockedGetStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });
        mockedGetDataSourceAdapters.mockReturnValue(createAdapterMock());
    });

    it("renders filters and the bootstrap empty state", async () => {
        render(
            await DocumentsPage({
                searchParams: Promise.resolve({
                    scope: "all",
                }),
            }),
        );

        expect(screen.getByText("Documents")).toBeInTheDocument();
        expect(screen.getByText("Documents Filters")).toBeInTheDocument();
        expect(
            screen.getByText(/No documents created yet/i),
        ).toBeInTheDocument();
        expect(
            screen.queryAllByRole("link").some((link) =>
                link.getAttribute("href")?.startsWith("/work/documents/"),
            ),
        ).toBe(false);
    });

    it("preserves filter and sort params in pagination links when empty", async () => {
        render(
            await DocumentsPage({
                searchParams: Promise.resolve({
                    scope: "all",
                    q: "access",
                    domain: "Access Management",
                    status: ["complete", "blocked"],
                    sortBy: "openTasks",
                    sortDir: "asc",
                    page: "2",
                }),
            }),
        );

        expect(screen.getByText("Documents Filters")).toBeInTheDocument();
        expect(
            screen.getByText(/No documents created yet/i),
        ).toBeInTheDocument();
    });
});
