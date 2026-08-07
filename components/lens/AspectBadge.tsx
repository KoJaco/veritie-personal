import type { AspectKey } from "@/lib/domain/aspect";
import {
    ASPECT_ICONS,
    aspectBadgeClass,
    getAspectBadgeLabel,
} from "@/lib/aspect/aspect-ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AspectBadge({
    aspect,
    className,
}: {
    aspect: AspectKey;
    className?: string;
}) {
    const Icon = ASPECT_ICONS[aspect];

    return (
        <Badge
            variant="outline"
            className={cn(
                "text-[10px] uppercase border-0 shadow-none",
                aspectBadgeClass(aspect),
                className,
            )}
        >
            <Icon className="size-3" />
            {getAspectBadgeLabel(aspect)}
        </Badge>
    );
}
