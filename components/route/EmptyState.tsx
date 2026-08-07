import { Button } from "@/components/ui/button";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

/**
 * Empty state component for routes with no data.
 * Provides consistent messaging and optional action.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className={cn(SURFACE_CLASS, "flex flex-col items-center justify-center h-full min-h-[200px] text-center p-8")}>
      {icon && (
        <div className="mb-4 text-muted-foreground/50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          onClick={action.onClick}
          {...(action.href ? {} : {})}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface NoResultsProps {
  message?: string;
  onClear?: () => void;
}

/**
 * No results state for filtered lists.
 */
export function NoResults({ message = "No results match your filters.", onClear }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-8">
      <p className="text-muted-foreground mb-4">{message}</p>
      {onClear && (
        <Button variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
