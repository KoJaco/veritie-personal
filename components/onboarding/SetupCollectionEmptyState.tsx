import type { ReactNode } from "react";

export function SetupCollectionEmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <div className="space-y-1.5">
                <p className="text-base font-medium">{title}</p>
                <p className="max-w-md text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {action ? <div>{action}</div> : null}
        </div>
    );
}
