"use client";

import { AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { envPublic } from "@/lib/config/env.public";

export interface ErrorStateProps {
    /**
     * Error title (i.e., "Something went wrong")
     */
    title?: string;
    /**
     * Error message to display
     */
    message: string;
    /**
     * Optional action button
     */
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    /**
     * Optional additional details (i.e., error code)
     * Only shown in dev
     */
    details?: string;
}

/**
 * Generic error state UI component
 *
 * Displays a user-friendly error message with optional action button.
 * Details are only shown in development mode.
 */
export function ErrorState({
    title = "Something went wrong",
    message,
    action,
    details,
}: ErrorStateProps) {
    const isDevelopment =
        process.env.NODE_ENV === "development" && envPublic.appEnv === "local";

    return (
        <div className="flex h-screen flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md space-y-4 text-center">
                <div className="flex justify-center">
                    <AlertCircle
                        className="h-12 w-12 text-destructive"
                        aria-hidden="true"
                    />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {title}
                    </h1>
                    <p className="text-muted-foreground">{message}</p>
                </div>

                {action && (
                    <div className="pt-4">
                        <button
                            onClick={action.onClick}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {action.icon && (
                                <action.icon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            {action.label}
                        </button>
                    </div>
                )}

                {isDevelopment && details && (
                    <div className="pt-4">
                        <details className="text-left">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                Details
                            </summary>
                            <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs">
                                {details}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
