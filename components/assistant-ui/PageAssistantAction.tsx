"use client";

import { Sparkles } from "lucide-react";
import { PageHeaderActionButton } from "@/components/route/PageHeaderActionButton";
import { useContextRail } from "@/components/context/ContextRailProvider";

interface PageAssistantActionProps {
    canOpenAssistant: boolean;
    label?: string;
}

export function PageAssistantAction({
    canOpenAssistant,
    label = "Ask Veritie",
}: PageAssistantActionProps) {
    const { open, state } = useContextRail();

    if (!canOpenAssistant) {
        return null;
    }

    return (
        <PageHeaderActionButton
            icon={Sparkles}
            label={label}
            variant="default"
            onClick={() => open()}
            aria-expanded={state !== "CLOSED"}
            disabled={true}
        />
    );
}
