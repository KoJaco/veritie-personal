import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    intent?: string;
    actions?: ReactNode;
    metadata?: ReactNode;
    separator?: boolean;
}

/**
 * Standardized page header for dashboard routes.
 * Provides consistent layout: title + intent, actions, metadata, separator.
 */
export function PageHeader({
    title,
    description,
    intent,
    actions,
    metadata,
    separator = true,
}: PageHeaderProps) {
    return (
        <>
            <div className="shrink-0 w-full min-h-[5.5rem] space-y-3">
                {/* Title row with optional intent/description */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl capitalize font-semibold tracking-tight">
                            {title}
                        </h1>
                        {intent && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {intent}
                            </p>
                        )}
                        {description && !intent && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Metadata area */}
                {metadata && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {metadata}
                    </div>
                )}
            </div>
            {/* separator or spacer depending on props */}
            {separator ? (
                <Separator className="my-4" />
            ) : (
                <div className="my-4" />
            )}
        </>
    );
}

interface PageMetadataProps {
    children: ReactNode;
}

/**
 * Metadata item for page headers (e.g., counts, status chips).
 */
export function PageMetadata({ children }: PageMetadataProps) {
    return <>{children}</>;
}
