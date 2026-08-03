import { Suspense, type ReactNode } from "react";
import { AppShellPageHeader } from "./AppShellPageHeaderProvider";

interface PageFrameProps {
    children: ReactNode;
    header?: ReactNode;
    className?: string;
}

/**
 * PageFrame component
 *
 * Shared layout wrapper for pages that ensures consistent spacing and structure.
 * Validates scroll behavior within AppShell's main content area.
 *
 * Per scroll contract: Main content area scrolls independently, sidebar and header are fixed.
 */
export function PageFrame({ children, header, className }: PageFrameProps) {
    return (
        <div
            className={`w-full flex flex-col bg-background rounded-lg ${className || ""}`}
        >
            <Suspense fallback={<div className="min-h-[5.5rem] flex" />}>
                {header && <AppShellPageHeader>{header}</AppShellPageHeader>}
            </Suspense>
            {children}
        </div>
    );
}
