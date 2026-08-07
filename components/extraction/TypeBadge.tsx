import { Badge } from "@/components/ui/badge";
import {
    getObjectTypeBadgeLabel,
    OBJECT_TYPE_ICONS,
} from "@/lib/extraction/object-type-ui";
import type { ExtractedObjectType } from "@/lib/domain/extraction";
import { cn } from "@/lib/utils";

export function TypeBadge({
    objectType,
    className,
}: {
    objectType: ExtractedObjectType;
    className?: string;
}) {
    const Icon = OBJECT_TYPE_ICONS[objectType];

    return (
        <Badge
            variant="outline"
            className={cn("gap-1 text-[10px] uppercase", className)}
        >
            <Icon className="size-3" />
            {getObjectTypeBadgeLabel(objectType)}
        </Badge>
    );
}
