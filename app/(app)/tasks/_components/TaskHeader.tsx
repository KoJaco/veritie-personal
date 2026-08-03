"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TaskDetailReadModel } from "@/lib/data-source";
import { CheckCircle2 } from "lucide-react";

type TaskHeaderActionsProps = {
    task: TaskDetailReadModel;
};

export function TaskHeaderActions({ task }: TaskHeaderActionsProps) {
    const [markedComplete, setMarkedComplete] = useState(false);

    return (
        <>
            <Button
                size="sm"
                onClick={() => {
                    setMarkedComplete(true);
                    toast.success("Task marked complete for this session.", {
                        description:
                            "This branch keeps completion as a frontend-only stub interaction.",
                    });
                }}
                disabled={markedComplete || task.status === "completed"}
            >
                <CheckCircle2 className="h-4 w-4" />
                Mark complete
            </Button>
        </>
    );
}
