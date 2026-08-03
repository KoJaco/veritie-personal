import { render, screen } from "@testing-library/react";
import DocumentDetailPage from "@/app/(app)/work/documents/[id]/page";
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

jest.mock("fs/promises", () => ({
    readFile: jest.fn().mockResolvedValue("# Fixture markdown"),
}));

jest.mock("@/components/static/PageFrame", () => ({
    PageFrame: ({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) => (
        <div>
            {header}
            {children}
        </div>
    ),
}));

jest.mock("@/components/context/ContextPayloadSlot", () => ({
    ContextPayloadSlot: () => null,
}));

jest.mock("@/components/context/build-rail-payload", () => ({
    buildRailPayload: () => null,
}));

jest.mock("@/components/route", () => ({
    PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
        <div>
            <h1>{title}</h1>
            {actions}
        </div>
    ),
}));

jest.mock("@/components/attachments/AttachmentUploadFlow", () => ({
    AttachmentUploadFlow: ({ triggerLabel = "upload attachment" }) => (
        <button type="button">{triggerLabel}</button>
    ),
}));

jest.mock("@/components/content/MarkdownRenderer", () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

jest.mock("@/components/attachments/ObjectSupportingAttachmentsSection", () => ({
    ObjectSupportingAttachmentsSection: ({
        items,
    }: {
        items: Array<{ id: string; title: string }>;
    }) => (
        <section>
            <h2>Supporting Attachments</h2>
            {items.map((item) => (
                <a key={item.id} href={`/work/documents/${item.id}`}>
                    Open attachment
                    {item.title}
                </a>
            ))}
        </section>
    ),
}));

jest.mock("@/lib/logging/server-logger", () => ({
    logger: {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
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

describe("DocumentDetailPage attachment integration", () => {
    it("renders supporting attachments section while moving attachment actions into the header", async () => {
        mockedGetDataSourceAdapters.mockReturnValue(createAdapterMock());

        render(
            await DocumentDetailPage({
                params: Promise.resolve({ id: "check-narrative" }),
                searchParams: Promise.resolve({ scope: "all" }),
            }),
        );

        expect(screen.getByText("Supporting Attachments")).toBeInTheDocument();
        expect(
            screen.getByText(/Access provisioning approval sample/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Identity workflow configuration snapshot/i),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /attach existing attachment/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /upload attachment/i })).toBeInTheDocument();
        expect(screen.getByText("Document Content")).toBeInTheDocument();
        expect(
            screen.getAllByRole("link", { name: /open attachment/i }).length,
        ).toBeGreaterThan(0);
    });
});
