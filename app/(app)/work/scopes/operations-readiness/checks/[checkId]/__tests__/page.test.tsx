import { render, screen } from "@testing-library/react";
import OperationsReadinessCheckDetailPage from "@/app/(app)/work/scopes/operations-readiness/checks/[checkId]/page";
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
    PageHeader: ({
        title,
        description,
        actions,
        metadata,
    }: {
        title: string;
        description?: string;
        actions?: React.ReactNode;
        metadata?: React.ReactNode;
    }) => (
        <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
            {actions}
            {metadata}
        </div>
    ),
}));

jest.mock("@/components/context/ContextPayloadSlot", () => ({
    ContextPayloadSlot: () => null,
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

describe("OperationsReadinessCheckDetailPage", () => {
    it("renders readiness, attachment, and task sections", async () => {
        mockedGetDataSourceAdapters.mockReturnValue(createAdapterMock());

        render(
            await OperationsReadinessCheckDetailPage({
                params: Promise.resolve({ checkId: "check-narrative" }),
                searchParams: Promise.resolve({
                    scope: "operations-readiness",
                }),
            }),
        );

        expect(screen.getByText("Readiness")).toBeInTheDocument();
        expect(screen.getByText("Related Attachments")).toBeInTheDocument();
        expect(screen.getByText("Related Tasks")).toBeInTheDocument();
        expect(
            screen.getByText("Access provisioning approval sample"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Validate access provisioning approvals"),
        ).toBeInTheDocument();
    });
});
