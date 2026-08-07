"use client";

import { PageAssistantAction } from "@/components/assistant-ui/PageAssistantAction";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

interface TasksPageHeaderActionsProps {
    canOpenAssistant: boolean;
    createTaskDialogProps: {
        checks: Array<{ id: string; label: string }>;
        owners: Array<{ id: string; label: string }>;
        resources: Array<{ id: string; label: string }>;
    };
}

export function TasksPageHeaderActions({
    canOpenAssistant,
    createTaskDialogProps,
}: TasksPageHeaderActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <CreateTaskDialog {...createTaskDialogProps} />
            <PageAssistantAction canOpenAssistant={canOpenAssistant} />
        </div>
    );
}
