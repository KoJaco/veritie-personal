import { render, screen } from "@testing-library/react";
import OperationsReadinessPage from "@/app/(app)/work/scopes/operations-readiness/page";
import { getScopeMappingStatusStub } from "@/lib/stubs";

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

jest.mock("@/lib/stubs", () => ({
    ...jest.requireActual("@/lib/stubs"),
    getScopeMappingStatusStub: jest.fn(),
}));

const mockedGetScopeMappingStatusStub = jest.mocked(getScopeMappingStatusStub);

async function renderPage() {
    const Page = await OperationsReadinessPage({
        searchParams: Promise.resolve({}),
    });
    render(Page);
}

describe("OperationsReadinessPage", () => {
    it("renders fail-closed mapping copy when shared status is invalid", async () => {
        mockedGetScopeMappingStatusStub.mockReturnValue("invalid");

        await renderPage();

        expect(
            screen.getByText("Scope mapping baseline is invalid"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Fail-closed: readiness interpretation is disabled until scope mapping is fixed.",
            ),
        ).toBeInTheDocument();
    });

    it("preserves scope lens params in settings remediation CTA", async () => {
        mockedGetScopeMappingStatusStub.mockReturnValue("invalid");

        await renderPage();

        const link = screen.getByRole("link", {
            name: /open scope configuration/i,
        });

        expect(link).toHaveAttribute(
            "href",
            "/work/settings?scope=operations-readiness",
        );
    });

    it("renders a checks table with links scoped to the current scope lens", async () => {
        mockedGetScopeMappingStatusStub.mockReturnValue("valid");

        await renderPage();

        expect(screen.getByRole("columnheader", { name: /check/i })).toBeInTheDocument();

        const controlLink = screen.getAllByRole("link").find((link) =>
            link.getAttribute("href")?.includes("/work/scopes/operations-readiness/checks/"),
        );

        expect(controlLink).toBeDefined();
        expect(controlLink).toHaveAttribute(
            "href",
            expect.stringContaining("scope=operations-readiness"),
        );
    });
});
