"use client";

import { RefreshCw, WifiOff } from "lucide-react";

import { ErrorState } from "@/components/system/error-state";

export function OfflineScreen() {
    return (
        <ErrorState
            icon={WifiOff}
            title="You're offline"
            message="You must be online to use Veritie."
            action={{
                label: "Try again",
                onClick: () => window.location.reload(),
                icon: RefreshCw,
            }}
        />
    );
}
