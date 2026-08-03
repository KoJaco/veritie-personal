import { fireEvent, render, screen } from "@testing-library/react";
import { BlockingAndActions } from "@/app/(app)/work/_components/BlockingAndActions";
import type { TaskStub } from "@/lib/stubs";

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

function buildTask(overrides: Partial<TaskStub>): TaskStub {
    return {
        id: overrides.id ?? "task-1",
        title: overrides.title ?? "Task 1",
        status: overrides.status ?? "blocked",
        priority: overrides.priority ?? "high",
        dueAt: overrides.dueAt ?? "2026-03-07T00:00:00.000Z",
        assignee: overrides.assignee ?? {
            id: "assignee-1",
            name: "Jane Doe",
            email: "jane@example.com",
            isMe: true,
        },
        relatedObject:
            overrides.relatedObject ?? ({
                id: "obj-1",
                type: "procedure",
                title: "Access Control Policy",
            } as const),
        attachmentStatus: overrides.attachmentStatus ?? "missing",
        missingAttachmentCount: overrides.missingAttachmentCount ?? 2,
        updatedAt: overrides.updatedAt ?? "2026-03-01T00:00:00.000Z",
        scopeIds: overrides.scopeIds ?? ["operations-readiness"],
    };
}

describe("BlockingAndActions", () => {
    const lens = { scope: "operations-readiness" as const };
    const now = new Date("2026-03-08T00:00:00.000Z");

    it("renders empty-state copy when no action groups exist", () => {
        render(
            <BlockingAndActions
                blockingTasks={[]}
                dueSoonTasks={[]}
                quickWinTasks={[]}
                now={now}
                lens={lens}
            />,
        );

        expect(
            screen.getByText("No action groups need attention right now."),
        ).toBeInTheDocument();
    });

    it("renders blocking task links with lens params preserved", () => {
        render(
            <BlockingAndActions
                blockingTasks={[buildTask({ id: "task-abc", title: "Fix IAM" })]}
                dueSoonTasks={[]}
                quickWinTasks={[]}
                now={now}
                lens={lens}
            />,
        );

        const link = screen.getByRole("link", { name: /fix iam/i });
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("/work/tasks/task-abc"),
        );
        expect(link).toHaveAttribute(
            "href",
            expect.stringContaining("scope=operations-readiness"),
        );
    });

    it("expands blocking items when clicking view more", () => {
        const blockingTasks = Array.from({ length: 7 }).map((_, index) =>
            buildTask({
                id: `task-${index + 1}`,
                title: `Blocking Task ${index + 1}`,
            }),
        );

        render(
            <BlockingAndActions
                blockingTasks={blockingTasks}
                dueSoonTasks={[]}
                quickWinTasks={[]}
                now={now}
                lens={lens}
            />,
        );

        expect(screen.queryByRole("link", { name: /blocking task 6/i })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /view more/i }));

        expect(screen.getByRole("link", { name: /blocking task 6/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /blocking task 7/i })).toBeInTheDocument();
    });

    it("preserves lens on due-soon and quick-win task detail links", () => {
        render(
            <BlockingAndActions
                blockingTasks={[]}
                dueSoonTasks={[buildTask({ id: "due-1", title: "Due Soon Task", status: "todo" })]}
                quickWinTasks={[buildTask({ id: "quick-1", title: "Quick Win Task", status: "todo" })]}
                now={now}
                lens={lens}
            />,
        );

        const dueLink = screen.getByRole("link", { name: /due soon task/i });
        const quickLink = screen.getByRole("link", { name: /quick win task/i });

        expect(dueLink).toHaveAttribute(
            "href",
            expect.stringContaining("scope=operations-readiness"),
        );
        expect(quickLink).toHaveAttribute(
            "href",
            expect.stringContaining("scope=operations-readiness"),
        );
    });

    it("renders scope badge label from task scope ids", () => {
        render(
            <BlockingAndActions
                blockingTasks={[
                    buildTask({
                        id: "delivery-task",
                        title: "Delivery Task",
                        scopeIds: ["delivery-observability"],
                    }),
                ]}
                dueSoonTasks={[]}
                quickWinTasks={[]}
                now={now}
                lens={lens}
            />,
        );

        expect(screen.getByText("Delivery Observability")).toBeInTheDocument();
    });
});
