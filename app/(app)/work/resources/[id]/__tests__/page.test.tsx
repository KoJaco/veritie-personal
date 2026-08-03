import { render, screen } from "@testing-library/react";
import ResourceDetailPage from "@/app/(app)/work/resources/[id]/page";
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

jest.mock("@/lib/data-source", () => ({
    ...jest.requireActual("@/lib/data-source"),
    getDataSourceAdapters: jest.fn(),
}));

const mockedGetDataSourceAdapters = jest.mocked(getDataSourceAdapters);

function createAdapterMock(): DataSourceAdapters {
    const actual = jest.requireActual("@/lib/data-source/stub-adapter") as {
        stubDataSourceAdapters: DataSourceAdapters;
    };
    return actual.stubDataSourceAdapters;
}

describe("ResourceDetailPage", () => {
    it("renders posture summary, linked relations, and timeline", async () => {
        mockedGetDataSourceAdapters.mockReturnValue(createAdapterMock());

        render(
            await ResourceDetailPage({
                params: Promise.resolve({ id: "resource_seed_1" }),
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(screen.getByText("Resource detail")).toBeInTheDocument();
        expect(screen.getByText("Linked checks")).toBeInTheDocument();
        expect(screen.getByText("Linked attachments")).toBeInTheDocument();
        expect(screen.getByText("Linked tasks")).toBeInTheDocument();
        expect(screen.getByText("Timeline")).toBeInTheDocument();
        expect(
            screen.getAllByRole("link").every((link) => {
                const href = link.getAttribute("href") ?? "";
                return !href.includes("scope=");
            }),
        ).toBe(true);
    });
});
