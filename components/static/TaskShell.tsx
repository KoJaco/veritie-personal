import { type ReactNode } from "react";
import { Separator } from "../ui/separator";
import { AppShellPageHeader } from "./AppShellPageHeaderProvider";

interface TaskShellProps {
    header: ReactNode;
    children: ReactNode;
}

function TaskShellContent({ header, children }: TaskShellProps) {
    return (
        <>
            <AppShellPageHeader>
                <div>
                    {header}
                    <Separator className="my-4" />
                </div>
            </AppShellPageHeader>
            <div className="h-full w-full flex">
                <div className="min-w-0 w-full">{children}</div>
            </div>
        </>
    );
}

// The TaskShell is the core of the task-driven UI shell.
export function TaskShell({ header, children }: TaskShellProps) {
    return <TaskShellContent header={header}>{children}</TaskShellContent>;
}
